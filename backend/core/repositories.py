"""Repositorios de acesso a dados para os modelos de negocio.

BaseRepository fornece operacoes CRUD padrao com soft delete.
Repositorios especificos herdam e adicionam queries customizadas.
"""


class BaseRepository:
    """Repositorio base com operacoes CRUD e soft delete.

    Encapsula todo acesso ao ORM Django. Controllers e services
    nunca acessam o ORM diretamente — sempre via repository.

    Attributes:
        model: Modelo Django gerenciado por este repositorio.
    """

    model = None

    def get_all(self):
        """Retorna todos os registros ativos (soft delete filtrado).

        Returns:
            QuerySet: Registros com deleted_at IS NULL.
        """
        return self.model.objects.all()

    def get_by_id(self, pk):
        """Retorna um registro pelo ID.

        Args:
            pk: Chave primaria do registro.

        Returns:
            Model: Instancia do modelo.

        Raises:
            Model.DoesNotExist: Se o registro nao existe ou foi soft-deleted.
        """
        return self.model.objects.get(pk=pk)

    def create(self, **data):
        """Cria um novo registro.

        Args:
            **data: Campos do modelo como keyword arguments.

        Returns:
            Model: Instancia criada.
        """
        return self.model.objects.create(**data)

    def update(self, instance, **data):
        """Atualiza campos de um registro existente.

        Args:
            instance: Instancia do modelo a atualizar.
            **data: Campos a atualizar como keyword arguments.

        Returns:
            Model: Instancia atualizada.
        """
        for field, value in data.items():
            setattr(instance, field, value)
        instance.save(update_fields=list(data.keys()) + ['updated_at'])
        return instance

    def soft_delete(self, instance):
        """Marca um registro como deletado (soft delete).

        Args:
            instance: Instancia do modelo a deletar.
        """
        instance.soft_delete()

    def filter(self, **kwargs):
        """Filtra registros por campos arbitrarios.

        Args:
            **kwargs: Filtros do ORM Django.

        Returns:
            QuerySet: Registros filtrados.
        """
        return self.model.objects.filter(**kwargs)
