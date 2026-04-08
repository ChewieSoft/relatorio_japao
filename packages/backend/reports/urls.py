"""Configuracao de URLs do app reports.

Endpoints de listagem, geracao e exportacao (placeholder) de relatorios.
"""
from django.urls import path

from .controllers import ReportExportView, ReportGenerateView, ReportListController

urlpatterns = [
    path('reports/', ReportListController.as_view(), name='report-list'),
    path('reports/<str:number>/generate/', ReportGenerateView.as_view(), name='report-generate'),
    path('reports/<str:number>/', ReportExportView.as_view(), name='report-export'),
]
