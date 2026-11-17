import type { Request, Response } from 'express';
import { lerConsulta } from '../../shared/middlewares/validar';
import { exigirUsuario } from '../../shared/types/requisicao';
import { esquemaListarAulas, type EntradaAceitarAula } from './aulas.schemas';
import type { AulasService } from './aulas.service';

export class AulasController {
  constructor(private readonly servico: AulasService) {}

  solicitar = async (req: Request, res: Response): Promise<void> => {
    const itens = await this.servico.solicitar(exigirUsuario(req), req.body);
    res.status(201).json({ itens });
  };

  listar = async (req: Request, res: Response): Promise<void> => {
    const consulta = lerConsulta(req, esquemaListarAulas);
    const pagina = await this.servico.listar(exigirUsuario(req), consulta);
    res.status(200).json(pagina);
  };

  obterDetalhe = async (req: Request, res: Response): Promise<void> => {
    const aula = await this.servico.obterDetalhe(exigirUsuario(req), String(req.params.id));
    res.status(200).json(aula);
  };

  aceitar = async (req: Request, res: Response): Promise<void> => {
    const { serie } = req.body as EntradaAceitarAula;
    const aula = await this.servico.aceitar(exigirUsuario(req), String(req.params.id), { serie });
    res.status(200).json(aula);
  };

  recusar = async (req: Request, res: Response): Promise<void> => {
    const aula = await this.servico.recusar(
      exigirUsuario(req),
      String(req.params.id),
      req.body.motivo,
    );
    res.status(200).json(aula);
  };
}
