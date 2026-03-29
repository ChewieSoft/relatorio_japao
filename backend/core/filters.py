"""FilterSets para os modelos de negocio do app core.

Define campos filtraveis por modelo para uso com django-filter.
"""
import django_filters

from .models import (
    AntiVirus,
    Cellphone,
    Collaborator,
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


class CollaboratorFilter(django_filters.FilterSet):
    """Filtros para Collaborator."""

    class Meta:
        model = Collaborator
        fields = ['status', 'fired', 'office', 'admin_privilege']


class MachineFilter(django_filters.FilterSet):
    """Filtros para Machine."""

    class Meta:
        model = Machine
        fields = ['type', 'sold_out', 'crypto_disk']


class SoftwareFilter(django_filters.FilterSet):
    """Filtros para Software."""

    class Meta:
        model = Software
        fields = ['type_licence', 'departament']


class EmailFilter(django_filters.FilterSet):
    """Filtros para Email."""

    class Meta:
        model = Email
        fields = ['collaborator']


class CellphoneFilter(django_filters.FilterSet):
    """Filtros para Cellphone."""

    class Meta:
        model = Cellphone
        fields = ['collaborator', 'status']


class WifiFilter(django_filters.FilterSet):
    """Filtros para Wifi."""

    class Meta:
        model = Wifi
        fields = ['collaborator', 'year']


class AntiVirusFilter(django_filters.FilterSet):
    """Filtros para AntiVirus."""

    class Meta:
        model = AntiVirus
        fields = ['machine', 'year']


class ServerFilter(django_filters.FilterSet):
    """Filtros para Server."""

    class Meta:
        model = Server
        fields = ['machine', 'have_backup']


class ServerAccessFilter(django_filters.FilterSet):
    """Filtros para ServerAccess."""

    class Meta:
        model = ServerAccess
        fields = ['collaborator']


class ServerErpAccessFilter(django_filters.FilterSet):
    """Filtros para ServerErpAccess."""

    class Meta:
        model = ServerErpAccess
        fields = ['collaborator']


class DataDestroyedFilter(django_filters.FilterSet):
    """Filtros para DataDestroyed."""

    class Meta:
        model = DataDestroyed
        fields = ['machine']


class PenDriveFilter(django_filters.FilterSet):
    """Filtros para PenDrive."""

    class Meta:
        model = PenDrive
        fields = ['collaborator', 'have_virus']
