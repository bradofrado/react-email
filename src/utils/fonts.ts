import { NextFont } from 'next/dist/compiled/@next/font';
import {Inter, Roboto, Open_Sans, Alegreya, Montserrat, Lato, Poppins, Mulish, Corben, Nobile} from 'next/font/google';

interface Font {
	id: string;
	name: string;
	font: NextFont
}

const inter = Inter({
    subsets: ['latin']
});
const roboto = Roboto({
    subsets: ['latin'],
    weight: ['100', '300', '400', '500', '700', '900']
});

const openSans = Open_Sans({
    subsets: ['latin']
});

const alegreya = Alegreya({
    subsets: ['latin']
});

const montserrat = Montserrat({
    subsets: ['latin']
});

const lato = Lato({
    subsets: ['latin'],
    weight: ['100', '300', '400', '700', '900']
});

const poppins = Poppins({
    subsets: ['latin'],
    weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900']
})

const mulish = Mulish({
    subsets: ['latin']
});

const corben = Corben({
    subsets: ['latin'],
    weight: ['400', '700']
})

const nobile = Nobile({
    subsets: ['latin'],
    weight: ['400', '500', '700']
})

export const fonts: Font[] = [
    {
        id: inter.className,
        name: 'Inter',
        font: inter
    },
    {
        id: roboto.className,
        name: 'Roboto',
        font: roboto
    },
    {
        id: openSans.className,
        name: 'Open Sans',
        font: openSans
    },
    {
        id: alegreya.className,
        name: 'Alegreya',
        font: alegreya
    },
    {
        id: montserrat.className,
        name: 'Montserrat',
        font: montserrat
    },
    {
        id: lato.className,
        name: 'Lato',
        font: lato
    },
    {
        id: poppins.className,
        name: 'Poppins',
        font: poppins
    },
    {
        id: mulish.className,
        name: 'Mulish',
        font: mulish
    },
]