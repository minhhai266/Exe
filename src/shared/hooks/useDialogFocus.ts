import {useEffect} from 'react';
export function useDialogFocus(open:boolean|string|null){
 useEffect(()=>{
  if(!open)return;const previous=document.activeElement as HTMLElement|null;
  const dialog=document.querySelector<HTMLElement>('[data-focus-dialog]');
  const controls=()=>Array.from(dialog?.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),a[href],[tabindex="0"]')||[]).filter(e=>e.getClientRects().length);
  (dialog?.querySelector<HTMLElement>('textarea,input')||controls()[0])?.focus();
  const trap=(e:KeyboardEvent)=>{if(e.key!=='Tab')return;const elements=controls(),first=elements[0],last=elements.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus()}};
  document.addEventListener('keydown',trap);return()=>{document.removeEventListener('keydown',trap);previous?.focus()};
 },[open]);
}
