/// <reference types="vite/client" />
import type { AdminRecord } from '../admin/domain';

// Vite serves these files in development and includes them in production builds.
const files = import.meta.glob('../../../download/*.pdf', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
const documents: [string, string, number, string, string][] = [
 ['sgk-khtn-8', 'SGK_KHTN_8.pdf', 8, 'Sách giáo khoa', 'Khoa học tự nhiên 8'],
 ['sgk-khtn-9', 'SGK _KHTN_9.pdf', 9, 'Sách giáo khoa', 'Khoa học tự nhiên 9'],
 ['sgk-hoa-10', 'SGK_HOAHOC_10.pdf', 10, 'Sách giáo khoa', 'Hóa học 10'],
 // The source filenames for grades 11 and 12 are reversed; classify by the actual covers.
 ['sgk-hoa-11', 'SGK_HOAHOC_12.pdf', 11, 'Sách giáo khoa', 'Hóa học 11'],
 ['sgk-hoa-12', 'SGK_HOAHOC_11.pdf', 12, 'Sách giáo khoa', 'Hóa học 12'],
 ...[10, 11, 12].flatMap((grade): [string, string, number, string, string][] => [
  [`on-giua-ky-2-${grade}`, `de-cuong-giua-ki-2-hoa-${grade}${grade === 10 ? '' : '-hs'}.pdf`, grade, 'Ôn tập giữa kỳ II', `Đề cương giữa kỳ II · Hóa học ${grade}`],
  [`on-cuoi-ky-2-${grade}`, `HOA_${grade}_CUOIKY2.pdf`, grade, 'Ôn tập cuối kỳ II', `Ôn tập cuối kỳ II · Hóa học ${grade}`],
 ]),
];
export const localEbooks: AdminRecord[] = documents.map(([id, file, grade, category, name]) => ({
 id, code: id, name, status: 'published', createdAt: '', updatedAt: '', version: 1,
 data: { grade, category, subject: grade < 10 ? 'Khoa học tự nhiên' : 'Hóa học', author: '', chapters: [], pdf: files['../../../download/' + file], localDocument: true },
}));
export function mergeEbooks(published: AdminRecord[], includeLessons = false) {
 return [...localEbooks, ...published.filter(book => (includeLessons || !book.data.builtin) && !localEbooks.some(local => local.id === book.id))];
}
