import { Noto_Sans, Playfair_Display, Tajawal } from "next/font/google";


export const tajawal = Tajawal({
  subsets: ["arabic"],
  weight: ["300", "400", "500", "700"],
  variable: "--font-sans", 
});

export const notoSans = Noto_Sans({
  subsets: ["latin"],
  variable: "--font-sans", 
});

 export const playfairDisplayHeading = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-heading",
});
