"""Registro dos 14 modelos de negocio no Django Admin.

Configura list_display, search_fields e list_filter
para facilitar a gestao de dados via interface administrativa.
"""
from django.contrib import admin

from .models import (
    AntiVirus,
    Cellphone,
    Collaborator,
    CollaboratorMachine,
    CollaboratorSoftware,
    DataDestroyed,
    Email,
    Machine,
    PenDrive,
    Server,
    ServerAccess,
    ServerErpAccess,
    Software,
    Wifi,
)


@admin.register(Collaborator)
class CollaboratorAdmin(admin.ModelAdmin):
    """Admin para Collaborator."""

    list_display = ['full_name', 'domain_user', 'office', 'status', 'fired']
    search_fields = ['full_name', 'domain_user']
    list_filter = ['status', 'fired', 'office', 'admin_privilege']


@admin.register(Machine)
class MachineAdmin(admin.ModelAdmin):
    """Admin para Machine."""

    list_display = ['hostname', 'model', 'service_tag', 'ip', 'type', 'crypto_disk']
    search_fields = ['hostname', 'model', 'service_tag', 'ip']
    list_filter = ['type', 'crypto_disk', 'sold_out']


@admin.register(Software)
class SoftwareAdmin(admin.ModelAdmin):
    """Admin para Software."""

    list_display = ['software_name', 'key', 'type_licence', 'quantity', 'on_use', 'expires_at']
    search_fields = ['software_name', 'key']
    list_filter = ['type_licence', 'departament']


@admin.register(Email)
class EmailAdmin(admin.ModelAdmin):
    """Admin para Email."""

    list_display = ['email', 'collaborator', 'email_creation']
    search_fields = ['email']
    list_filter = ['collaborator']


@admin.register(Cellphone)
class CellphoneAdmin(admin.ModelAdmin):
    """Admin para Cellphone."""

    list_display = ['model', 'phone_number', 'collaborator', 'status']
    search_fields = ['phone_number', 'model']
    list_filter = ['status', 'approved']


@admin.register(Wifi)
class WifiAdmin(admin.ModelAdmin):
    """Admin para Wifi."""

    list_display = ['wifi_name', 'collaborator', 'year', 'protection']
    search_fields = ['wifi_name']
    list_filter = ['year']


@admin.register(AntiVirus)
class AntiVirusAdmin(admin.ModelAdmin):
    """Admin para AntiVirus."""

    list_display = ['machine', 'year']
    list_filter = ['year']


@admin.register(Server)
class ServerAdmin(admin.ModelAdmin):
    """Admin para Server."""

    list_display = ['machine', 'have_backup', 'backup_date']
    list_filter = ['have_backup']


@admin.register(ServerAccess)
class ServerAccessAdmin(admin.ModelAdmin):
    """Admin para ServerAccess."""

    list_display = ['collaborator', 'level01', 'level02', 'level03', 'level04', 'level05', 'level06']


@admin.register(ServerErpAccess)
class ServerErpAccessAdmin(admin.ModelAdmin):
    """Admin para ServerErpAccess."""

    list_display = ['collaborator', 'purchase', 'sale', 'production_control', 'service']


@admin.register(DataDestroyed)
class DataDestroyedAdmin(admin.ModelAdmin):
    """Admin para DataDestroyed."""

    list_display = ['machine', 'when_data_is_destroyed', 'i_can_destroy_data']


@admin.register(PenDrive)
class PenDriveAdmin(admin.ModelAdmin):
    """Admin para PenDrive."""

    list_display = ['collaborator', 'checked_date', 'have_virus']
    list_filter = ['have_virus']


@admin.register(CollaboratorSoftware)
class CollaboratorSoftwareAdmin(admin.ModelAdmin):
    """Admin para CollaboratorSoftware."""

    list_display = ['collaborator', 'software']


@admin.register(CollaboratorMachine)
class CollaboratorMachineAdmin(admin.ModelAdmin):
    """Admin para CollaboratorMachine."""

    list_display = ['collaborator', 'machine']
