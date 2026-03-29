"""Controllers REST para os modelos de negocio do app core.

BaseController fornece CRUD HTTP completo via ModelViewSet.
Delega logica de negocio ao service correspondente.
Controllers especificos serao adicionados nas fases seguintes.
"""
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated


class BaseController(viewsets.ModelViewSet):
    """Controller base com CRUD completo e autenticacao obrigatoria.

    Delega create, update e destroy ao service correspondente.
    Nunca acessa o ORM diretamente — sempre via service.

    Attributes:
        service: Instancia do service gerenciado.
    """

    permission_classes = [IsAuthenticated]
    service = None

    def perform_create(self, serializer):
        """Delega criacao ao service.

        Args:
            serializer: Serializer com dados validados.
        """
        self.service.create(serializer.validated_data)

    def perform_update(self, serializer):
        """Delega atualizacao ao service.

        Args:
            serializer: Serializer com dados validados.
        """
        self.service.update(self.get_object().pk, serializer.validated_data)

    def perform_destroy(self, instance):
        """Delega soft delete ao service.

        Args:
            instance: Instancia do modelo a deletar.
        """
        self.service.delete(instance.pk)
