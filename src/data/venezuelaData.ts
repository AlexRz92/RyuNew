export interface State {
  code: string;
  name: string;
}

export interface City {
  name: string;
  stateCode: string;
}

export const states: State[] = [
  { code: 'AMZ', name: 'Amazonas' },
  { code: 'ANZ', name: 'Anzoátegui' },
  { code: 'APU', name: 'Apure' },
  { code: 'ARA', name: 'Aragua' },
  { code: 'BAR', name: 'Barinas' },
  { code: 'BOL', name: 'Bolívar' },
  { code: 'CAR', name: 'Carabobo' },
  { code: 'COJ', name: 'Cojedes' },
  { code: 'DAM', name: 'Delta Amacuro' },
  { code: 'FAL', name: 'Falcón' },
  { code: 'GUA', name: 'Guárico' },
  { code: 'LAR', name: 'Lara' },
  { code: 'MER', name: 'Mérida' },
  { code: 'MIR', name: 'Miranda' },
  { code: 'MON', name: 'Monagas' },
  { code: 'NES', name: 'Nueva Esparta' },
  { code: 'POR', name: 'Portuguesa' },
  { code: 'SUC', name: 'Sucre' },
  { code: 'TAC', name: 'Táchira' },
  { code: 'TRU', name: 'Trujillo' },
  { code: 'VAR', name: 'Vargas' },
  { code: 'YAR', name: 'Yaracuy' },
  { code: 'ZUL', name: 'Zulia' },
  { code: 'DC', name: 'Distrito Capital' },
];

export const cities: City[] = [
  { name: 'Coro', stateCode: 'FAL' },
  { name: 'Punto Fijo', stateCode: 'FAL' },
  { name: 'Tucacas', stateCode: 'FAL' },
  { name: 'Chichiriviche', stateCode: 'FAL' },
  { name: 'Caracas', stateCode: 'MIR' },
  { name: 'Los Teques', stateCode: 'MIR' },
  { name: 'Guarenas', stateCode: 'MIR' },
  { name: 'Guatire', stateCode: 'MIR' },
  { name: 'Petare', stateCode: 'MIR' },
  { name: 'Baruta', stateCode: 'MIR' },
  { name: 'Chacao', stateCode: 'MIR' },
  { name: 'Maracaibo', stateCode: 'ZUL' },
  { name: 'Cabimas', stateCode: 'ZUL' },
  { name: 'Ciudad Ojeda', stateCode: 'ZUL' },
  { name: 'Valencia', stateCode: 'CAR' },
  { name: 'Puerto Cabello', stateCode: 'CAR' },
  { name: 'Maracay', stateCode: 'ARA' },
  { name: 'Barquisimeto', stateCode: 'LAR' },
  { name: 'Puerto La Cruz', stateCode: 'ANZ' },
  { name: 'Barcelona', stateCode: 'ANZ' },
  { name: 'Maturín', stateCode: 'MON' },
  { name: 'Ciudad Bolívar', stateCode: 'BOL' },
  { name: 'Puerto Ordaz', stateCode: 'BOL' },
  { name: 'San Cristóbal', stateCode: 'TAC' },
  { name: 'Mérida', stateCode: 'MER' },
  { name: 'Porlamar', stateCode: 'NES' },
  { name: 'Cumaná', stateCode: 'SUC' },
];

export function getCitiesByState(stateCode: string): City[] {
  return cities.filter((city) => city.stateCode === stateCode);
}
