export function downloadFile(url: string, filename?: string): void {
  if (filename) {
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } else {
    const iframe = document.createElement("iframe");
    iframe.src = url;
    iframe.style.display = "none";
    document.body.appendChild(iframe);
    iframe.onload = () => {
      document.body.removeChild(iframe);
    };
    iframe.onerror = () => {
      document.body.removeChild(iframe);
    };
  }
  return;
}
