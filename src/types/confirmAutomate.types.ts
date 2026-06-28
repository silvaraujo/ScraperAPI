export interface TextoCapturado {
  tag: string;
  texto: string;
  classes: string;
  isHeading: boolean;
}

export interface ConfirmationResult {
  success: boolean;
  textosCapturados?: TextoCapturado[];
  error?: string;
}