"""Configuracao WSGI para o projeto config.

Expoe o callable WSGI como variavel de modulo chamada ``application``.
"""
import os

from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

application = get_wsgi_application()
