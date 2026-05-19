export type ActivarCuentaRequest = {
  token: string;
  password: string;
};

export type ActivarCuentaResponse = {
  ok: true;
  mensaje: string;
};