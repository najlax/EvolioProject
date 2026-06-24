"""Reusable Google Gemini AI helper.

Used only by the AI feature endpoints. It is intentionally self-contained and
fails softly: if the API key or the `google-genai` package is missing, or the
Gemini call errors out, it raises AIServiceError which the routers turn into a
clean HTTP error instead of crashing the app.
"""

import json
import logging
import os
import re

logger = logging.getLogger("evolio.ai")

GEMINI_MODEL = "gemini-2.5-flash"
ENV_KEY = "GEMINI_API_KEY"


class AIServiceError(Exception):
    """Raised when an AI call cannot be completed."""


def _read_api_key() -> str | None:
    """Read GEMINI_API_KEY from the environment, falling back to backend/.env."""
    key = os.getenv(ENV_KEY)
    if key:
        return key.strip()

    # Optional convenience: pick the key up from a local backend/.env file
    # (which is git-ignored) without requiring python-dotenv.
    env_path = os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env"
    )
    try:
        with open(env_path, "r", encoding="utf-8") as fh:
            for line in fh:
                line = line.strip()
                if line.startswith(f"{ENV_KEY}="):
                    return line.split("=", 1)[1].strip().strip('"').strip("'")
    except OSError:
        pass
    return None


class AIService:
    """Thin wrapper around the Gemini text-generation API."""

    def __init__(self):
        self.api_key = _read_api_key()

    # -- low level ---------------------------------------------------------
    def _generate(self, prompt: str) -> str:
        if not self.api_key:
            raise AIServiceError(
                "AI is not configured. Set the GEMINI_API_KEY environment variable."
            )
        try:
            # Imported lazily so the app still boots if the package is absent.
            from google import genai
        except ImportError as exc:  # pragma: no cover - depends on env
            raise AIServiceError(
                "The google-genai package is not installed."
            ) from exc

        try:
            client = genai.Client(api_key=self.api_key)
            response = client.models.generate_content(
                model=GEMINI_MODEL, contents=prompt
            )
            return (getattr(response, "text", "") or "").strip()
        except Exception as exc:  # noqa: BLE001 - log any provider/network error
            logger.warning("Gemini request failed: %s", exc)
            raise AIServiceError("The AI service is temporarily unavailable.") from exc

    # -- features ----------------------------------------------------------
    def extract_skills(self, title: str, description: str, technologies) -> list[str]:
        """Return a clean, de-duplicated list of skills found in a project."""
        tech_text = ", ".join(technologies) if isinstance(technologies, list) else (
            technologies or ""
        )
        prompt = (
            "You are a precise technical skill extractor for a student portfolio.\n"
            "From the project information below, extract all relevant technical "
            "skills, programming languages, frameworks, libraries, databases, "
            "tools, game engines, platforms and technologies.\n\n"
            "Return ONLY a JSON array of unique skill strings. No explanations, "
            "no extra text, no markdown, no duplicates, and do not invent skills "
            "that are not clearly implied by the text.\n\n"
            f"Title: {title or ''}\n"
            f"Description: {description or ''}\n"
            f"Technologies: {tech_text}\n"
        )
        raw = self._generate(prompt)
        return _parse_skill_list(raw)

    def generate_portfolio_summary(self, profile_text: str) -> str:
        """Return a short, professional portfolio summary paragraph."""
        prompt = (
            "Write a concise, professional portfolio summary (2-3 sentences, "
            "first person) for the student described below. Return ONLY the "
            "summary text with no headings, labels or markdown.\n\n"
            f"{profile_text}\n"
        )
        summary = self._generate(prompt)
        # Strip surrounding quotes/whitespace the model may add.
        return summary.strip().strip('"').strip()

    # The exact reply required when the answer is not in the student's data.
    NOT_AVAILABLE = "This information is not available in the student's profile."

    def answer_portfolio_question(
        self, context: str, question: str, history: list | None = None
    ) -> str:
        """Answer an employer's question using ONLY the student's data.

        `history` is the prior conversation (a list of {role, text}) so the bot
        can understand follow-up questions. The prompt forbids outside knowledge
        and guessing; when the answer is not present in the provided data the
        model must return the exact NOT_AVAILABLE sentence.
        """
        conversation = ""
        if history:
            lines = []
            # Keep the last few turns to stay within a reasonable prompt size.
            for turn in history[-10:]:
                role = (turn.get("role") or "").lower()
                speaker = "Employer" if role == "user" else "Assistant"
                text = (turn.get("text") or "").strip()
                if text:
                    lines.append(f"{speaker}: {text}")
            if lines:
                conversation = (
                    "CONVERSATION SO FAR:\n" + "\n".join(lines) + "\n\n"
                )

        prompt = (
            "You are a professional, recruitment-focused AI assistant in a live "
            "chat with an employer about ONE candidate. Use ONLY the candidate's "
            "portfolio data provided below.\n\n"
            "GUIDELINES:\n"
            "- Base every answer ONLY on the provided portfolio data. Never use "
            "outside knowledge and never invent specific facts (no made-up "
            "employers, dates, numbers or technologies).\n"
            "- You MAY summarize, compare and draw reasonable conclusions FROM "
            "that data — e.g. infer key strengths from the listed skills and "
            "projects, or recommend fit for a role.\n"
            "- Use the conversation so far to understand follow-up questions.\n"
            "- Reply conversationally and concisely (1-4 sentences), like a "
            "helpful recruiter — not a report.\n"
            "- Only if the data contains nothing relevant to the question, reply "
            f'EXACTLY: "{self.NOT_AVAILABLE}"\n\n'
            f"CANDIDATE PORTFOLIO DATA:\n{context}\n\n"
            f"{conversation}"
            f"EMPLOYER QUESTION: {question}\n"
        )
        answer = self._generate(prompt).strip()
        return answer or self.NOT_AVAILABLE


def _parse_skill_list(raw: str) -> list[str]:
    """Parse the model output into a unique, ordered list of skill strings."""
    if not raw:
        return []

    text = raw.strip()
    # Remove ```json ... ``` / ``` ... ``` code fences if present.
    if text.startswith("```"):
        text = re.sub(r"^```[a-zA-Z]*\n?", "", text)
        text = re.sub(r"\n?```$", "", text).strip()

    # Fall back to the first [...] block if there is any stray text around it.
    if not text.startswith("["):
        match = re.search(r"\[.*\]", text, re.DOTALL)
        if match:
            text = match.group(0)

    try:
        data = json.loads(text)
    except (ValueError, TypeError):
        return []

    if not isinstance(data, list):
        return []

    seen = set()
    skills = []
    for item in data:
        if not isinstance(item, str):
            continue
        name = item.strip()
        key = name.lower()
        if name and key not in seen:
            seen.add(key)
            skills.append(name)
    return skills


def merge_unique(existing: list[str], new: list[str]) -> list[str]:
    """Merge two skill lists, keeping order and removing case-insensitive dups."""
    result = []
    seen = set()
    for item in list(existing or []) + list(new or []):
        if not isinstance(item, str):
            continue
        name = item.strip()
        key = name.lower()
        if name and key not in seen:
            seen.add(key)
            result.append(name)
    return result
