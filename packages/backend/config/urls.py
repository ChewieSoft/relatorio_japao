"""Configuracao de URLs raiz do projeto JRC Brasil.

Mapeia prefixos de URL para os apps: accounts (auth),
core (CRUD entidades) e reports (relatorios).
"""
from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('accounts.urls')),
    path('api/', include('core.urls')),
    path('api/', include('reports.urls')),
]
