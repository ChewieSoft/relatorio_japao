"""Services de logica de negocio para os modelos do app core.

BaseService fornece orquestracao padrao entre controller e repository.
Services especificos herdam e adicionam logica de negocio customizada.
"""


class BaseService:
    """Service base com operacoes CRUD delegadas ao repository.

    Cada service orquestra chamadas ao repository correspondente.
    Logica de negocio (validacoes, transacoes) fica no service,
    nunca no controller ou repository.

    Attributes:
        repository: Instancia do repository gerenciado.
    """

    repository = None

    def list(self):
        """Retorna todos os registros ativos.

        Returns:
            QuerySet: Todos os registros via repository.
        """
        return self.repository.get_all()

    def get(self, pk):
        """Retorna um registro pelo ID.

        Args:
            pk: Chave primaria do registro.

        Returns:
            Model: Instancia do modelo.
        """
        return self.repository.get_by_id(pk)

    def create(self, data):
        """Cria um novo registro.

        Args:
            data: Dicionario com campos do modelo.

        Returns:
            Model: Instancia criada.
        """
        return self.repository.create(**data)

    def update(self, pk, data):
        """Atualiza um registro existente.

        Args:
            pk: Chave primaria do registro.
            data: Dicionario com campos a atualizar.

        Returns:
            Model: Instancia atualizada.
        """
        instance = self.repository.get_by_id(pk)
        return self.repository.update(instance, **data)

    def delete(self, pk):
        """Soft-delete de um registro.

        Args:
            pk: Chave primaria do registro a deletar.
        """
        instance = self.repository.get_by_id(pk)
        self.repository.soft_delete(instance)
