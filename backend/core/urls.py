"""Configuracao de URLs do app core.

Registra endpoints CRUD via DefaultRouter.
Controllers serao adicionados nas fases seguintes.
"""
from django.urls import include, path
from rest_framework.routers import DefaultRouter

router = DefaultRouter()

urlpatterns = [
    path('', include(router.urls)),
]
