/**
 * Dados mock para handlers MSW.
 *
 * Baseados nos dados de exemplo originais,
 * convertidos para o formato snake_case da API Django REST.
 * Usados apenas em ambiente de desenvolvimento.
 */

/** Colaboradores mock no formato da API (snake_case). */
export const collaborators = [
  { id: 1, name: "Carlos Tanaka", domain_user: "ctanaka", department: "Engenharia", status: true, fired: false, has_server_access: true, has_erp_access: true, has_internet_access: true, has_cellphone: true, email: "ctanaka@jrcbrasil.com" },
  { id: 2, name: "Maria Suzuki", domain_user: "msuzuki", department: "Financeiro", status: true, fired: false, has_server_access: false, has_erp_access: true, has_internet_access: true, has_cellphone: false, email: "msuzuki@jrcbrasil.com" },
  { id: 3, name: "Roberto Yamamoto", domain_user: "ryamamoto", department: "TI", status: true, fired: false, has_server_access: true, has_erp_access: true, has_internet_access: true, has_cellphone: true, email: "ryamamoto@jrcbrasil.com" },
  { id: 4, name: "Ana Watanabe", domain_user: "awatanabe", department: "RH", status: true, fired: false, has_server_access: false, has_erp_access: true, has_internet_access: true, has_cellphone: false, email: "awatanabe@jrcbrasil.com" },
  { id: 5, name: "Pedro Nakamura", domain_user: "pnakamura", department: "Produção", status: false, fired: false, has_server_access: false, has_erp_access: false, has_internet_access: false, has_cellphone: false, email: "pnakamura@jrcbrasil.com" },
  { id: 6, name: "Fernanda Sato", domain_user: "fsato", department: "Comercial", status: true, fired: false, has_server_access: false, has_erp_access: true, has_internet_access: true, has_cellphone: true, email: "fsato@jrcbrasil.com" },
  { id: 7, name: "Lucas Hayashi", domain_user: "lhayashi", department: "TI", status: true, fired: false, has_server_access: true, has_erp_access: true, has_internet_access: true, has_cellphone: true, email: "lhayashi@jrcbrasil.com" },
  { id: 8, name: "Juliana Kimura", domain_user: "jkimura", department: "Qualidade", status: true, fired: false, has_server_access: false, has_erp_access: false, has_internet_access: true, has_cellphone: false, email: "jkimura@jrcbrasil.com" },
]

/** Máquinas mock no formato da API (snake_case). */
export const machines = [
  { id: 1, hostname: "JRC-ENG-001", model: "Dell OptiPlex 7090", service_tag: "ABCD1234", ip: "192.168.1.10", mac_address: "AA:BB:CC:DD:EE:01", operational_system: "Windows 11 Pro", encrypted: true, antivirus: true, collaborator_id: 1, collaborator_name: "Carlos Tanaka", machine_type: "desktop" as const },
  { id: 2, hostname: "JRC-FIN-002", model: "Dell Latitude 5520", service_tag: "EFGH5678", ip: "192.168.1.11", mac_address: "AA:BB:CC:DD:EE:02", operational_system: "Windows 11 Pro", encrypted: true, antivirus: true, collaborator_id: 2, collaborator_name: "Maria Suzuki", machine_type: "notebook" as const },
  { id: 3, hostname: "JRC-TI-003", model: "Dell OptiPlex 7090", service_tag: "IJKL9012", ip: "192.168.1.12", mac_address: "AA:BB:CC:DD:EE:03", operational_system: "Windows 11 Pro", encrypted: true, antivirus: true, collaborator_id: 3, collaborator_name: "Roberto Yamamoto", machine_type: "desktop" as const },
  { id: 4, hostname: "JRC-RH-004", model: "Dell Latitude 5520", service_tag: "MNOP3456", ip: "192.168.1.13", mac_address: "AA:BB:CC:DD:EE:04", operational_system: "Windows 10 Pro", encrypted: false, antivirus: true, collaborator_id: 4, collaborator_name: "Ana Watanabe", machine_type: "notebook" as const },
  { id: 5, hostname: "JRC-COM-005", model: "Dell OptiPlex 5090", service_tag: "QRST7890", ip: "192.168.1.14", mac_address: "AA:BB:CC:DD:EE:05", operational_system: "Windows 11 Pro", encrypted: true, antivirus: true, collaborator_id: 6, collaborator_name: "Fernanda Sato", machine_type: "desktop" as const },
  { id: 6, hostname: "JRC-TI-006", model: "Dell Precision 5560", service_tag: "UVWX1234", ip: "192.168.1.15", mac_address: "AA:BB:CC:DD:EE:06", operational_system: "Windows 11 Pro", encrypted: true, antivirus: true, collaborator_id: 7, collaborator_name: "Lucas Hayashi", machine_type: "notebook" as const },
]

/** Software mock no formato da API (snake_case). */
export const software = [
  { id: 1, software_name: "Microsoft Office 365", license_key: "XXXXX-XXXXX-XXXXX-XXXXX", license_type: "subscription" as const, quantity: 50, in_use: 38, expires_at: "2026-12-31" },
  { id: 2, software_name: "AutoCAD 2024", license_key: "YYYYY-YYYYY-YYYYY-YYYYY", license_type: "subscription" as const, quantity: 10, in_use: 8, expires_at: "2026-06-30" },
  { id: 3, software_name: "Windows 11 Pro", license_key: "OEM", license_type: "oem" as const, quantity: 45, in_use: 45, expires_at: null },
  { id: 4, software_name: "Kaspersky Endpoint Security", license_key: "ZZZZZ-ZZZZZ-ZZZZZ-ZZZZZ", license_type: "subscription" as const, quantity: 50, in_use: 44, expires_at: "2026-09-15" },
  { id: 5, software_name: "SAP Business One", license_key: "WWWWW-WWWWW-WWWWW-WWWWW", license_type: "perpetual" as const, quantity: 20, in_use: 15, expires_at: null },
  { id: 6, software_name: "Adobe Creative Cloud", license_key: "VVVVV-VVVVV-VVVVV-VVVVV", license_type: "subscription" as const, quantity: 5, in_use: 4, expires_at: "2026-03-31" },
]

/** Relatórios mock no formato da API (snake_case). */
export const reports = [
  { id: 1, number: "08", name: "Lista de Contatos Internos", name_jp: "社内連絡先一覧", category: "Pessoal", last_generated: "2025-11-15T00:00:00Z", status: "sent" as const },
  { id: 2, number: "09", name: "Lista de Computadores", name_jp: "JDBコンピューターリスト", category: "Equipamentos", last_generated: "2025-11-15T00:00:00Z", status: "sent" as const },
  { id: 3, number: "13", name: "Usuários de Domínio", name_jp: "Domain User List", category: "Acesso", last_generated: "2025-11-15T00:00:00Z", status: "sent" as const },
  { id: 4, number: "15", name: "Acesso ao Servidor", name_jp: "JDBファィル共有アクセス棚卸実施記録", category: "Acesso", last_generated: null, status: "pending" as const },
  { id: 5, number: "17", name: "Acesso à Internet", name_jp: "インターネットアクセス権棚卸記録", category: "Acesso", last_generated: null, status: "pending" as const },
  { id: 6, number: "19", name: "Licenças de Software", name_jp: "ソフトウエアーライセンス管理シート", category: "Software", last_generated: null, status: "pending" as const },
  { id: 7, number: "20", name: "Criptografia de Disco", name_jp: "社外ノートパソコン・ディスク暗号化", category: "Segurança", last_generated: "2025-11-15T00:00:00Z", status: "sent" as const },
  { id: 8, number: "21", name: "Celulares Corporativos", name_jp: "会社支給携帯電話確認記録", category: "Equipamentos", last_generated: null, status: "pending" as const },
  { id: 9, number: "22", name: "Destruição de Dados", name_jp: "情報機器破棄にともなうデータ消去", category: "Segurança", last_generated: null, status: "pending" as const },
  { id: 10, number: "23", name: "Acesso ao ERP", name_jp: "ERP MICROSOFT Dynamicsアクセス権", category: "Acesso", last_generated: "2025-11-15T00:00:00Z", status: "generated" as const },
  { id: 11, number: "24", name: "Lista de E-mails", name_jp: "メールリスト棚卸実施記録", category: "Pessoal", last_generated: null, status: "pending" as const },
  { id: 12, number: "25", name: "Verificação de Pendrives", name_jp: "USBメモリー利用・ウィルス確認記録", category: "Segurança", last_generated: null, status: "pending" as const },
  { id: 13, number: "26", name: "Antivírus", name_jp: "パターンファィル確認記録", category: "Segurança", last_generated: "2025-11-15T00:00:00Z", status: "generated" as const },
  { id: 14, number: "28", name: "Permissão de Uso de Software", name_jp: "ソフトウエアー導入・運用確認記録", category: "Software", last_generated: null, status: "pending" as const },
  { id: 15, number: "29", name: "Atualizações de Segurança", name_jp: "セキュリティパッチ確認記録", category: "Segurança", last_generated: null, status: "pending" as const },
  { id: 16, number: "31", name: "Verificação de Antivírus", name_jp: "ウィルススキャン確認記録", category: "Segurança", last_generated: null, status: "pending" as const },
  { id: 17, number: "33", name: "Acesso WiFi", name_jp: "無線ラン端末利用確認書", category: "Infraestrutura", last_generated: null, status: "pending" as const },
  { id: 18, number: "34", name: "Troca de Senha WiFi", name_jp: "無線ランセキュリティ確認書", category: "Infraestrutura", last_generated: null, status: "pending" as const },
  { id: 19, number: "35", name: "Backup de Servidores", name_jp: "サーバーバックアップ管理台帳", category: "Segurança", last_generated: "2025-11-15T00:00:00Z", status: "sent" as const },
]

/** Usuário mock para autenticação. */
export const mockUser = {
  id: 1,
  username: "admin",
  email: "admin@jrcbrasil.com",
  is_staff: true,
}

/** Tokens JWT mock. */
export const mockTokens = {
  access: "mock-access-token-for-dev",
  refresh: "mock-refresh-token-for-dev",
}
