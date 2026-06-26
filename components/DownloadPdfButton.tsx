"use client";

import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export default function DownloadPdfButton({
  title,
}: {
  title: string;
}) {
async function captureSection(
  element: HTMLElement,
  pdf: jsPDF,
  addPage = true
) {
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#ffffff",
    logging: false,
  });

  const imgData = canvas.toDataURL("image/png");

  const pdfWidth =
    pdf.internal.pageSize.getWidth();

  const pdfHeight =
    pdf.internal.pageSize.getHeight();

  const imgWidth = pdfWidth;

  const imgHeight =
    (canvas.height * imgWidth) /
    canvas.width;

  if (addPage) {
    pdf.addPage();
  }

  let heightLeft = imgHeight;
  let position = 0;

  pdf.addImage(
    imgData,
    "PNG",
    0,
    position,
    imgWidth,
    imgHeight
  );

  heightLeft -= pdfHeight;

  while (heightLeft > 0) {
    position = heightLeft - imgHeight;

    pdf.addPage();

    pdf.addImage(
      imgData,
      "PNG",
      0,
      position,
      imgWidth,
      imgHeight
    );

    heightLeft -= pdfHeight;
  }
}

async function generatePdf() {
const main =
  document.getElementById("pdf-main");

const polls =
  document.getElementById("pdf-polls");

const footer =
  document.getElementById("pdf-footer");

  if (!main) {
    alert("Newsletter not found.");
    return;
  }

  const pdf = new jsPDF(
    "p",
    "mm",
    "a4"
  );

await captureSection(main, pdf, false);

if (polls) {
  await captureSection(polls, pdf);
}

  pdf.save(`${title}.pdf`);
}

  return (
    <button
      onClick={generatePdf}
      className="rounded bg-[#EF4444] px-6 py-3 text-white hover:bg-[#DC2626]"
    >
      Download PDF
    </button>
  );
}