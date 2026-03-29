import { BadRequestException } from '@nestjs/common';
import countries from 'i18n-iso-countries';
import enLocale from 'i18n-iso-countries/langs/en.json';
import itLocale from 'i18n-iso-countries/langs/it.json';
import comuni from 'comuni-json/comuni.json';
import { ErrorCodes } from '../../common/errors/error-codes';

countries.registerLocale(enLocale);
countries.registerLocale(itLocale);

type ComuneEntry = {
  codice: string;
  nome: string;
  regione: {
    codice: string;
    nome: string;
  };
  provincia: {
    codice: string;
    nome: string;
  };
  sigla: string;
};

type NormalizedOriginInput = {
  originCountryCode: string;
  originRegion?: string;
  originProvince?: string;
  originComune?: string;
};

type OriginOption = {
  code: string;
  name: string;
  regionCode?: string;
};

type ItalianComuneOption = {
  code: string;
  name: string;
  regionCode: string;
  provinceCode: string;
};

const ITALIAN_COMUNI = comuni as ComuneEntry[];

const italianRegionsByCode = new Map<string, string>();
const italianProvincesByCode = new Map<string, { name: string; regionCodes: Set<string> }>();
const italianComuniByCode = new Map<string, ItalianComuneOption>();

for (const comune of ITALIAN_COMUNI) {
  italianRegionsByCode.set(comune.regione.codice, comune.regione.nome);

  const province = italianProvincesByCode.get(comune.provincia.codice);
  if (province) {
    province.regionCodes.add(comune.regione.codice);
  } else {
    italianProvincesByCode.set(comune.provincia.codice, {
      name: comune.provincia.nome,
      regionCodes: new Set([comune.regione.codice]),
    });
  }

  if (!italianComuniByCode.has(comune.codice)) {
    italianComuniByCode.set(comune.codice, {
      code: comune.codice,
      name: comune.nome,
      regionCode: comune.regione.codice,
      provinceCode: comune.provincia.codice,
    });
  }
}

export function normalizeOriginInput(input: {
  originCountryCode: string;
  originRegion?: string | null;
  originProvince?: string | null;
  originComune?: string | null;
}): NormalizedOriginInput {
  return {
    originCountryCode: input.originCountryCode.trim().toUpperCase(),
    originRegion: input.originRegion?.trim() || undefined,
    originProvince: input.originProvince?.trim() || undefined,
    originComune: input.originComune?.trim() || undefined,
  };
}

export function validateOriginInput(input: NormalizedOriginInput): void {
  if (!countries.isValid(input.originCountryCode)) {
    throw new BadRequestException({
      code: ErrorCodes.FIELD_LOT_ORIGIN_INVALID_COUNTRY,
      message: 'originCountryCode is not a valid ISO country code',
    });
  }

  if (input.originCountryCode !== 'IT') {
    return;
  }

  if (input.originRegion && !italianRegionsByCode.has(input.originRegion)) {
    throw new BadRequestException({
      code: ErrorCodes.FIELD_LOT_ORIGIN_INVALID_REGION,
      message: 'originRegion is not a valid Italian region ISTAT code',
    });
  }

  const province = input.originProvince
    ? italianProvincesByCode.get(input.originProvince)
    : undefined;

  if (input.originProvince && !province) {
    throw new BadRequestException({
      code: ErrorCodes.FIELD_LOT_ORIGIN_INVALID_PROVINCE,
      message: 'originProvince is not a valid Italian province ISTAT code',
    });
  }

  if (province && input.originRegion && !province.regionCodes.has(input.originRegion)) {
    throw new BadRequestException({
      code: ErrorCodes.FIELD_LOT_ORIGIN_INCOHERENT_REGION,
      message: 'originProvince is not coherent with originRegion',
    });
  }

  const comune = input.originComune ? italianComuniByCode.get(input.originComune) : undefined;

  if (input.originComune && !comune) {
    throw new BadRequestException({
      code: ErrorCodes.FIELD_LOT_ORIGIN_INVALID_COMUNE,
      message: 'originComune is not a valid Italian comune ISTAT code',
    });
  }

  if (comune && input.originRegion && comune.regionCode !== input.originRegion) {
    throw new BadRequestException({
      code: ErrorCodes.FIELD_LOT_ORIGIN_INCOHERENT_REGION,
      message: 'originComune is not coherent with originRegion',
    });
  }

  if (comune && input.originProvince && comune.provinceCode !== input.originProvince) {
    throw new BadRequestException({
      code: ErrorCodes.FIELD_LOT_ORIGIN_INCOHERENT_PROVINCE,
      message: 'originComune is not coherent with originProvince',
    });
  }
}

export function getIsoCountryOptions(): OriginOption[] {
  const namesByCode = countries.getNames('it', { select: 'official' });
  return Object.entries(namesByCode)
    .map(([code, name]) => ({ code, name }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function getItalianRegionOptions(): OriginOption[] {
  return Array.from(italianRegionsByCode.entries())
    .map(([code, name]) => ({ code, name }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function getItalianProvinceOptions(regionCode?: string): OriginOption[] {
  return Array.from(italianProvincesByCode.entries())
    .filter(([_, value]) => !regionCode || value.regionCodes.has(regionCode))
    .map(([code, value]) => ({
      code,
      name: value.name,
      regionCode: Array.from(value.regionCodes).sort()[0],
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function getItalianComuneOptions(params: {
  regionCode?: string;
  provinceCode?: string;
  search?: string;
}): ItalianComuneOption[] {
  const search = params.search?.trim().toLowerCase();

  if (!params.regionCode && !params.provinceCode && !search) {
    return [];
  }

  return Array.from(italianComuniByCode.values())
    .filter((comune) => !params.regionCode || comune.regionCode === params.regionCode)
    .filter((comune) => !params.provinceCode || comune.provinceCode === params.provinceCode)
    .filter((comune) => !search || comune.name.toLowerCase().includes(search))
    .sort((a, b) => a.name.localeCompare(b.name))
    .slice(0, 500);
}
