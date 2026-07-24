"""Testes de regressao para datas de calendario (off-by-one de timezone).

Cobrem o bug reportado no chamado da data de contratacao: campos de data
modelados como DateTimeField com USE_TZ=True (America/Sao_Paulo, UTC-3)
deslocavam a data em um dia a cada round-trip pela API. Apos a correcao
(campos convertidos para DateField), a API deve trafegar YYYY-MM-DD puro e
o valor deve sobreviver identico a create, retrieve e re-save.

Estes testes usam o backend real (DRF + banco), reproduzindo a condicao de
timezone que o mock MSW nao exercitava.
"""
import pytest

# Datas de calendario fixas usadas nas asserces de round-trip.
HIRE_DATE = '2026-07-23'
FIRED_DATE = '2026-08-01'
PURCHASE_DATE = '2026-06-15'
SOLD_OUT_DATE = '2026-09-30'
LAST_PURCHASE_DATE = '2026-01-10'
EXPIRES_DATE = '2027-01-10'


def _collaborator_payload(**overrides):
    """Monta um payload valido de colaborador com datas de calendario.

    Args:
        **overrides: Campos que sobrescrevem os defaults do payload.

    Returns:
        dict: Dados snake_case aceitos por /api/collaborators/.
    """
    payload = {
        'full_name': 'Date RoundTrip User',
        'domain_user': 'date.roundtrip',
        'status': True,
        'fired': True,
        'date_hired': HIRE_DATE,
        'date_fired': FIRED_DATE,
        'office': 'TI',
    }
    payload.update(overrides)
    return payload


def _machine_payload(**overrides):
    """Monta um payload valido de maquina com datas de calendario.

    Args:
        **overrides: Campos que sobrescrevem os defaults do payload.

    Returns:
        dict: Dados snake_case aceitos por /api/machines/.
    """
    payload = {
        'model': 'Dell RoundTrip',
        'type': 'notebook',
        'service_tag': 'RT0001',
        'operacional_system': 'Windows 11',
        'ram_memory': '16GB',
        'disk_memory': '512GB',
        'ip': '192.168.77.1',
        'mac_address': 'BB:BB:BB:BB:BB:01',
        'administrator': 'TI',
        'cod_jdb': 'JDBRT1',
        'date_purchase': PURCHASE_DATE,
        'sold_out': True,
        'date_sold_out': SOLD_OUT_DATE,
        'quantity': 1,
    }
    payload.update(overrides)
    return payload


def _software_payload(**overrides):
    """Monta um payload valido de software com datas de calendario.

    Args:
        **overrides: Campos que sobrescrevem os defaults do payload.

    Returns:
        dict: Dados snake_case aceitos por /api/software/.
    """
    payload = {
        'software_name': 'RoundTrip Suite',
        'key': 'RT-KEY-0001',
        'quantity': 5,
        'type_licence': 'subscription',
        'quantity_purchase': 5,
        'last_purchase_date': LAST_PURCHASE_DATE,
        'on_use': 2,
        'departament': 'TI',
        'expires_at': EXPIRES_DATE,
    }
    payload.update(overrides)
    return payload


@pytest.mark.django_db
class TestCollaboratorDateRoundTrip:
    """Round-trip das datas de Collaborator (contratacao e demissao)."""

    def test_hire_and_fire_dates_survive_create_and_retrieve(self, api_client):
        """Verifica que date_hired e date_fired voltam identicos apos create."""
        create = api_client.post(
            '/api/collaborators/', _collaborator_payload(), format='json'
        )
        assert create.status_code == 201

        detail = api_client.get(f"/api/collaborators/{create.data['id']}/")
        assert detail.data['date_hired'] == HIRE_DATE
        assert detail.data['date_fired'] == FIRED_DATE

    def test_hire_date_does_not_drift_on_resave_loop(self, api_client):
        """Reproduz o bug do chamado: reabrir e salvar nao pode recuar a data.

        Simula o que o frontend faz (le a data da API e a reenvia no save),
        repetido varias vezes. Antes da correcao a data recuava um dia por
        ciclo; agora deve permanecer estavel.
        """
        collaborator_id = api_client.post(
            '/api/collaborators/', _collaborator_payload(), format='json'
        ).data['id']

        for _ in range(3):
            current = api_client.get(
                f'/api/collaborators/{collaborator_id}/'
            ).data
            assert current['date_hired'] == HIRE_DATE
            resave = api_client.put(
                f'/api/collaborators/{collaborator_id}/',
                _collaborator_payload(date_hired=current['date_hired']),
                format='json',
            )
            assert resave.status_code == 200

        final = api_client.get(f'/api/collaborators/{collaborator_id}/').data
        assert final['date_hired'] == HIRE_DATE


@pytest.mark.django_db
class TestMachineDateRoundTrip:
    """Round-trip das datas de Machine (compra e venda/descarte)."""

    def test_purchase_and_sold_out_dates_survive_create_and_retrieve(self, api_client):
        """Verifica que date_purchase e date_sold_out voltam identicos."""
        create = api_client.post(
            '/api/machines/', _machine_payload(), format='json'
        )
        assert create.status_code == 201

        detail = api_client.get(f"/api/machines/{create.data['id']}/")
        assert detail.data['date_purchase'] == PURCHASE_DATE
        assert detail.data['date_sold_out'] == SOLD_OUT_DATE

    def test_purchase_dates_do_not_drift_on_resave_loop(self, api_client):
        """Reabrir e salvar a maquina nao pode recuar date_purchase/date_sold_out.

        Mesmo mecanismo do bug do chamado, aplicado a compra e baixa da
        maquina: le as datas da API e as reenvia no save, repetidamente.
        Antes da correcao a data recuava um dia por ciclo; agora deve
        permanecer estavel.
        """
        machine_id = api_client.post(
            '/api/machines/', _machine_payload(), format='json'
        ).data['id']

        for _ in range(3):
            current = api_client.get(f'/api/machines/{machine_id}/').data
            assert current['date_purchase'] == PURCHASE_DATE
            assert current['date_sold_out'] == SOLD_OUT_DATE
            resave = api_client.put(
                f'/api/machines/{machine_id}/',
                _machine_payload(
                    date_purchase=current['date_purchase'],
                    date_sold_out=current['date_sold_out'],
                ),
                format='json',
            )
            assert resave.status_code == 200

        final = api_client.get(f'/api/machines/{machine_id}/').data
        assert final['date_purchase'] == PURCHASE_DATE
        assert final['date_sold_out'] == SOLD_OUT_DATE


@pytest.mark.django_db
class TestSoftwareDateRoundTrip:
    """Round-trip das datas de Software (ultima compra e expiracao)."""

    def test_purchase_and_expiry_dates_survive_create_and_retrieve(self, api_client):
        """Verifica que last_purchase_date e expires_at voltam identicos."""
        create = api_client.post(
            '/api/software/', _software_payload(), format='json'
        )
        assert create.status_code == 201

        detail = api_client.get(f"/api/software/{create.data['id']}/")
        assert detail.data['last_purchase_date'] == LAST_PURCHASE_DATE
        assert detail.data['expires_at'] == EXPIRES_DATE

    def test_dates_do_not_drift_on_resave_loop(self, api_client):
        """Reabrir e salvar o software nao pode recuar as datas.

        Le last_purchase_date e expires_at da API e os reenvia no save,
        repetidamente, garantindo que a licenca mantem as datas estaveis
        apos a correcao (DateField + YYYY-MM-DD puro).
        """
        software_id = api_client.post(
            '/api/software/', _software_payload(), format='json'
        ).data['id']

        for _ in range(3):
            current = api_client.get(f'/api/software/{software_id}/').data
            assert current['last_purchase_date'] == LAST_PURCHASE_DATE
            assert current['expires_at'] == EXPIRES_DATE
            resave = api_client.put(
                f'/api/software/{software_id}/',
                _software_payload(
                    last_purchase_date=current['last_purchase_date'],
                    expires_at=current['expires_at'],
                ),
                format='json',
            )
            assert resave.status_code == 200

        final = api_client.get(f'/api/software/{software_id}/').data
        assert final['last_purchase_date'] == LAST_PURCHASE_DATE
        assert final['expires_at'] == EXPIRES_DATE
