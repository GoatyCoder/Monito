import type { CreateFieldLotDto, FieldLot, UpdateFieldLotDto } from '@monito/types';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { createResourceCrudHooks, ResourceFilters } from './use-resource-crud';

export type FieldLotFilters = ResourceFilters;

const fieldLotCrud = createResourceCrudHooks<FieldLot, CreateFieldLotDto, UpdateFieldLotDto>(
  'field-lots',
  'field-lots',
);

export const useFieldLots = fieldLotCrud.useList;
export const useFieldLot = fieldLotCrud.useById;
export const useCreateFieldLot = fieldLotCrud.useCreate;
export const useUpdateFieldLot = fieldLotCrud.useUpdate;
export const useDeleteFieldLot = fieldLotCrud.useDelete;
export const useRestoreFieldLot = fieldLotCrud.useRestore;
export const usePurgeFieldLot = fieldLotCrud.usePurge;

export type OriginOption = {
  code: string;
  name: string;
  regionCode?: string;
};

export type ComuneOption = {
  code: string;
  name: string;
  regionCode: string;
  provinceCode: string;
};

export function useAllFieldLots() {
  return useQuery({
    queryKey: ['field-lots', 'all'],
    queryFn: async () => {
      const response = await api.get<{ data: FieldLot[] }>('/field-lots/all');
      return response.data.data;
    },
  });
}

export function useOriginCountries() {
  return useQuery({
    queryKey: ['field-lots', 'origin-countries'],
    queryFn: async () => {
      const response = await api.get<{ data: OriginOption[] }>('/field-lots/origins/countries');
      return response.data.data;
    },
  });
}

export function useItalianOriginRegions() {
  return useQuery({
    queryKey: ['field-lots', 'origin-it-regions'],
    queryFn: async () => {
      const response = await api.get<{ data: OriginOption[] }>('/field-lots/origins/it/regions');
      return response.data.data;
    },
  });
}

export function useItalianOriginProvinces(regionCode?: string) {
  return useQuery({
    queryKey: ['field-lots', 'origin-it-provinces', regionCode ?? 'all'],
    queryFn: async () => {
      const response = await api.get<{ data: OriginOption[] }>('/field-lots/origins/it/provinces', {
        params: { regionCode },
      });
      return response.data.data;
    },
    enabled: true,
  });
}

export function useItalianOriginComuni(params: {
  regionCode?: string;
  provinceCode?: string;
  search?: string;
}) {
  return useQuery({
    queryKey: [
      'field-lots',
      'origin-it-comuni',
      params.regionCode ?? 'all',
      params.provinceCode ?? 'all',
      params.search ?? '',
    ],
    queryFn: async () => {
      const response = await api.get<{ data: ComuneOption[] }>('/field-lots/origins/it/comuni', {
        params,
      });
      return response.data.data;
    },
    enabled: !!params.search || !!params.provinceCode || !!params.regionCode,
  });
}
