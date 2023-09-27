import { DiscDTO } from '~/types';

export function convertLineBreaks(value: string): string {
  return value.replaceAll('\n', '%0a');
}

export function lineBreakToBr(value: string): string {
  return value.replaceAll('\n', '<br/>');
}

export function replaceTokensWithValues(message: string, disc: DiscDTO): string {
  return message
    .replace('[colour]', disc.discColour ? disc.discColour : '')
    .replace('[disc]', disc.discName ? disc.discName : '');
}
