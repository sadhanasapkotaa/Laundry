import logging
import requests
from django.core.exceptions import ValidationError
from django.db import models
from django.utils.translation import gettext_lazy as _

logger = logging.getLogger(__name__)

class LaundryService(models.Model):
    name = models.CharField(max_length=255)
    description_en = models.TextField()
    description_hi = models.TextField(blank=True, null=True)
    description_ne = models.TextField(blank=True, null=True)

    def auto_translate(self):
        api_url = "https://libretranslate.com/translate"
        headers = {"Content-Type": "application/json"}

        def translate(text, target_lang):
            payload = {
                "q": text,
                "source": "en",
                "target": target_lang,
                "format": "text"
            }
            try:
                response = requests.post(api_url, headers=headers, json=payload, timeout=5)
                response.raise_for_status()
                result = response.json().get("translatedText", "")
                if not result:
                    logger.warning(f"No translated text returned for language '{target_lang}'")
                return result
            except requests.exceptions.RequestException as e:
                logger.error(f"Translation API error for '{target_lang}' with text '{text}': {str(e)}")
                return None
            except Exception as e:
                logger.exception(f"Unexpected error during translation to '{target_lang}': {e}")
                return None

        self.description_hi = translate(self.description_en, "hi")
        if not self.description_hi:
            self.description_hi = "Translation failed (Hindi)"

        self.description_ne = translate(self.description_en, "ne")
        if not self.description_ne:
            self.description_ne = "Translation failed (Nepali)"

    def save(self, *args, **kwargs):
        if not self.description_hi or not self.description_ne:
            self.auto_translate()

        if not self.description_hi or not self.description_ne:
            raise ValidationError("Translation failed. Please try again later.")

        super().save(*args, **kwargs)