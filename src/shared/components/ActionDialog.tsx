import { X } from 'lucide-react';
import { useEffect,useRef,type ReactNode } from 'react';
export function ActionDialog({title,children,onClose}:{title:string;children:ReactNode;onClose:()=>void}){
 const ref=useRef<HTMLDialogElement>(null);
 useEffect(()=>{const previous=document.activeElement as HTMLElement|null;const dialog=ref.current;dialog?.showModal();dialog?.querySelector<HTMLElement>('input,select,textarea')?.focus();return()=>{dialog?.close();previous?.focus()}},[]);
 return <dialog ref={ref} className="action-dialog" aria-label={title} onCancel={e=>{e.preventDefault();onClose()}} onClick={e=>{if(e.target===e.currentTarget)onClose()}}><div className="action-dialog-body"><div className="action-dialog-heading"><h2>{title}</h2><button className="icon-btn" aria-label="Đóng" onClick={onClose}><X size={20}/></button></div>{children}</div></dialog>
}
