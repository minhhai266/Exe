import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useStore } from './labStore';

type Draft=ReturnType<typeof useStore.getState>['draftLabs'][string];
interface PracticeState{draftLabs:Record<string,Draft>;saveLab:(id:string,draft:Draft)=>void}
// Public practice never writes account drafts, submissions or classroom progress.
export const usePracticeStore=create<PracticeState>()(persist(set=>({draftLabs:{},saveLab:(id,draft)=>set(state=>({draftLabs:{...state.draftLabs,[id]:draft}}))}),{name:'virtual-lab-practice-v1'}));
