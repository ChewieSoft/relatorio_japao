"""Configuracao de URLs raiz do projeto JRC Brasil.

Mapeia prefixos de URL para os apps: accounts (auth),
core (CRUD entidades) e reports (relatorios).
"""
from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path


def healthz(request):
    """Endpoint publico de saude para healthcheck e smoke test do deploy.

    Nao exige autenticacao e nao acessa o banco — responde rapido para o
    healthcheck do container e para o passo de smoke do CD de staging.

    Args:
        request: Requisicao HTTP recebida (nao utilizada).

    Returns:
        JsonResponse: Corpo ``{"status": "ok"}`` com HTTP 200.
    """
    return JsonResponse({'status': 'ok'})


urlpatterns = [
    path('healthz/', healthz, name='healthz'),
    path('admin/', admin.site.urls),
    path('api/auth/', include('accounts.urls')),
    path('api/', include('core.urls')),
    path('api/', include('reports.urls')),
]
