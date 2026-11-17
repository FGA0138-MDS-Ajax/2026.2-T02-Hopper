export class AppError extends Error {
  constructor(
    public readonly status: number,
    public readonly codigo: string,
    mensagem: string,
    public readonly detalhes: unknown = null,
  ) {
    super(mensagem);
    this.name = new.target.name;
  }
}

export class ErroValidacao extends AppError {
  constructor(mensagem = 'Dados inválidos', detalhes: unknown = null, codigo = 'VALIDACAO') {
    super(422, codigo, mensagem, detalhes);
  }
}

export class ErroNaoAutenticado extends AppError {
  constructor(mensagem = 'Autenticação necessária', codigo = 'NAO_AUTENTICADO') {
    super(401, codigo, mensagem);
  }
}

export class ErroProibido extends AppError {
  constructor(mensagem = 'Acesso negado', codigo = 'PROIBIDO') {
    super(403, codigo, mensagem);
  }
}

export class ErroNaoEncontrado extends AppError {
  constructor(mensagem = 'Recurso não encontrado', codigo = 'NAO_ENCONTRADO') {
    super(404, codigo, mensagem);
  }
}

export class ErroConflito extends AppError {
  constructor(mensagem = 'Conflito de dados', codigo = 'CONFLITO') {
    super(409, codigo, mensagem);
  }
}

export class ErroRegraNegocio extends AppError {
  constructor(mensagem: string, codigo = 'REGRA_DE_NEGOCIO') {
    super(400, codigo, mensagem);
  }
}
