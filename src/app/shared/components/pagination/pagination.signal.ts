import { signal, computed } from "@angular/core";
import { paginationstore } from "../../../core/interfaces/common.interfaces";
import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";

export function createPagination<T>(dataSignal : () => T[]){
  const pagination  = signal<paginationstore>({ currentPage:1, pageSize:8 });

  const paginated = computed(()=>{
    const data = dataSignal();
    const {currentPage, pageSize } = pagination ();
    const start = (currentPage -1 ) * pageSize;
    return data.slice(start, start + pageSize);
  });

  const totalPages = computed(()=> Math.ceil(dataSignal().length / pagination().pageSize) );

  const nextPage = () => pagination.update(p => ({ ...p, currentPage: Math.min(p.currentPage + 1, totalPages() )}));
  const prevPage = () => pagination.update(p => ({ ...p, currentPage:Math.max(p.currentPage - 1 , 1)}));

  return { pagination , paginated, totalPages, nextPage, prevPage };

}