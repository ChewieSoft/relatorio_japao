"""Configuracao de URLs do app core.

Registra 12 endpoints CRUD via DefaultRouter e
endpoint de dashboard stats via path direto.
"""
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .controllers import (
    AntiVirusController,
    CellphoneController,
    CollaboratorController,
    DashboardStatsView,
    DataDestroyedController,
    EmailController,
    MachineController,
    PenDriveController,
    ServerAccessController,
    ServerController,
    ServerErpAccessController,
    SoftwareController,
    WifiController,
)

router = DefaultRouter()
router.register(r'collaborators', CollaboratorController, basename='collaborator')
router.register(r'machines', MachineController, basename='machine')
router.register(r'software', SoftwareController, basename='software')
router.register(r'emails', EmailController, basename='email')
router.register(r'cellphones', CellphoneController, basename='cellphone')
router.register(r'wifi', WifiController, basename='wifi')
router.register(r'antivirus', AntiVirusController, basename='antivirus')
router.register(r'servers', ServerController, basename='server')
router.register(r'server-access', ServerAccessController, basename='server-access')
router.register(r'erp-access', ServerErpAccessController, basename='erp-access')
router.register(r'data-destroyed', DataDestroyedController, basename='data-destroyed')
router.register(r'pen-drives', PenDriveController, basename='pen-drive')

urlpatterns = [
    path('', include(router.urls)),
    path('dashboard/stats/', DashboardStatsView.as_view(), name='dashboard-stats'),
]
