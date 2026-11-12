import { extendedChemicals, type ExtendedChemicalId } from './extendedChemicals';
export type ChemicalId = 'Zn' | 'HCl' | 'CuSO4' | 'NaOH' | 'ZnCl2' | 'H2' | 'Cu(OH)2' | 'Na2SO4' | 'NaCl' | 'H2O'|'H2O2'|'O2'|'MnO2'|'CaCO3'|'indicator'|ExtendedChemicalId;
export type Contents = Partial<Record<ChemicalId, number>>;
export const chemicals: Record<ChemicalId, {name:string; formula:string; phase:string; color:string; concentration?:number}> = {
 ...extendedChemicals,
 H2O2:{name:'Hiđro peoxit',formula:'H₂O₂',phase:'dung dịch',color:'#c5dfef',concentration:.5},O2:{name:'Oxi',formula:'O₂',phase:'khí',color:'#b6d8f3'},MnO2:{name:'Mangan(IV) oxit',formula:'MnO₂',phase:'rắn',color:'#4c4543'},CaCO3:{name:'Canxi cacbonat',formula:'CaCO₃',phase:'rắn',color:'#e7e8e9'},indicator:{name:'Phenolphthalein',formula:'PP',phase:'chỉ thị',color:'#e7b3d2'},
 Zn:{name:'Kẽm',formula:'Zn',phase:'rắn',color:'#94a3b8'}, HCl:{name:'Axit clohidric',formula:'HCl',phase:'dung dịch',color:'#a5e3ed',concentration:1},
 CuSO4:{name:'Đồng(II) sunfat',formula:'CuSO₄',phase:'dung dịch',color:'#38bdf8',concentration:1}, NaOH:{name:'Natri hiđroxit',formula:'NaOH',phase:'dung dịch',color:'#b9e5db',concentration:1},
 ZnCl2:{name:'Kẽm clorua',formula:'ZnCl₂',phase:'dung dịch',color:'#c7e7ed'}, H2:{name:'Hiđro',formula:'H₂',phase:'khí',color:'#e0f2fe'}, 'Cu(OH)2':{name:'Đồng(II) hiđroxit',formula:'Cu(OH)₂',phase:'kết tủa',color:'#0ea5e9'}, Na2SO4:{name:'Natri sunfat',formula:'Na₂SO₄',phase:'dung dịch',color:'#e2e8f0'}, NaCl:{name:'Natri clorua',formula:'NaCl',phase:'dung dịch',color:'#e2e8f0'}, H2O:{name:'Nước',formula:'H₂O',phase:'lỏng',color:'#dbeafe'}
};
export const reagents: ChemicalId[] = ['Zn','HCl','CuSO4','NaOH','H2O','H2O2','MnO2','CaCO3','indicator'];
