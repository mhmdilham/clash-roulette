import { toPng } from 'html-to-image';

export async function exportElementToPng(el: HTMLElement, filename: string): Promise<void> {
  const dataUrl = await toPng(el, {
    cacheBust: true,
    pixelRatio: 2,
    backgroundColor: '#12110f',
  });

  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  link.click();
}
