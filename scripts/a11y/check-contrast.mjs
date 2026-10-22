/*
 * Contrast check for the navy palette and the v2 tactile surfaces.
 *
 * The legacy design leaned on translucent white text over a blue gradient,
 * which looks right and measures badly: 45% white on a card is 2.79:1. These
 * pairs are the ones a resident actually reads, checked against the LIGHTEST
 * point of the gradient, which is the worst case. Anything under 4.5:1 exits
 * non-zero so a future restyle cannot quietly undo this.
 */
const hex=(h)=>{h=h.replace('#','');return [0,2,4].map(i=>parseInt(h.slice(i,i+2),16));};
const lin=(c)=>{c/=255;return c<=0.03928?c/12.92:Math.pow((c+0.055)/1.055,2.4);};
const L=(r)=>0.2126*lin(r[0])+0.7152*lin(r[1])+0.0722*lin(r[2]);
const over=(fg,a,bg)=>fg.map((c,i)=>c*a+bg[i]*(1-a));
const R=(a,b)=>{const l1=L(a),l2=L(b);const[h,l]=l1>l2?[l1,l2]:[l2,l1];return (h+0.05)/(l+0.05);};
const W=hex('#ffffff'), SHELL=hex('#1a4599');
const CARD=over(W,0.08,SHELL), RAISED=over(W,0.16,SHELL), INPUT=over(hex('#071852'),0.55,SHELL), NAV=hex('#0d2668');
// v2 tactile surfaces: the nav's pressed well and the dark badge pill.
const RSHELL=hex('#2563a8'), RCARD=over(W,0.08,RSHELL), RBADGE=over(hex('#14286e'),0.75,RSHELL);
const NAV_WELL=over(hex('#000000'),0.28,NAV), BADGE=over(hex('#14286e'),0.75,SHELL);
const rows=[
 ['white on card',W,CARD],['white on shell',W,SHELL],
 ['ink-soft 82% on card',over(W,0.82,CARD),CARD],
 ['ink-soft 82% on shell',over(W,0.82,SHELL),SHELL],
 ['ink-faint 72% on card',over(W,0.72,CARD),CARD],
 ['placeholder 83% on input',over(W,0.83,INPUT),INPUT],
 ['nav inactive 82% on nav',over(W,0.82,NAV),NAV],
 ['nav active #fac37b in well',hex('#fac37b'),NAV_WELL],
 ['offline banner ink on #fac37b',hex('#1c1c1e'),hex('#fac37b')],
 ['danger button ink on #f25c5c',hex('#1c1c1e'),hex('#f25c5c')],
 ['field text on well',W,INPUT],
 ['badge info on pill',hex('#93c5fd'),BADGE],
 ['badge warning on pill',hex('#fac37b'),BADGE],
 ['badge success on pill',hex('#55efc4'),BADGE],
 ['badge danger text on pill',hex('#ffbbbb'),BADGE],
 ['action row description 82% on raised card',over(W,0.82,RAISED),RAISED],
 ['white on raised card',W,RAISED],
 ['badge neutral 82% on pill',over(W,0.82,BADGE),BADGE],
 ['danger outline text #ffbbbb on card',hex('#ffbbbb'),CARD],
 ['button ink on orange',hex('#1c1c1e'),hex('#f5900a')],
 ['button ink on orange-strong',hex('#1c1c1e'),hex('#e07d00')],
 ['primary-text on card',hex('#fac37b'),CARD],
 ['danger-text on card',hex('#ffbbbb'),CARD],
 ['success-text on card',hex('#55efc4'),CARD],
 ['resident-text on card',hex('#a9d1fd'),CARD],
 ['warning-text on card',hex('#fac37b'),CARD],
 ['drawer link white on #0a2470',W,hex('#0a2470')],
 // The responder shell starts lighter (#2563a8); these are its worst cases.
 ['white on responder shell',W,RSHELL],
 ['ink-soft 82% on responder shell',over(W,0.82,RSHELL),RSHELL],
 ['responder ink-soft 92% on responder card',over(W,0.92,RCARD),RCARD],
 ['white on responder card',W,RCARD],
 ['white on responder orange row',W,over(hex('#f5900a'),0.2,RCARD)],
 ['badge info on pill over responder shell',hex('#93c5fd'),RBADGE],
 ['badge warning on pill over responder shell',hex('#fac37b'),RBADGE],
 ['modal text on #0e2a63',W,hex('#0e2a63')],
 ['modal soft 82% on #0e2a63',over(W,0.82,hex('#0e2a63')),hex('#0e2a63')],
];
let bad=[];
for(const [n,a,b] of rows){const r=R(a,b);if(r<4.5)bad.push(`${n} = ${r.toFixed(2)}`);console.log((r>=4.5?'AA  ':'FAIL'),r.toFixed(2).padStart(6),n);}
if (bad.length) {
  console.error('\nBelow WCAG AA (4.5:1):\n' + bad.join('\n'));
  process.exit(1);
}

console.log('\nAll pairs clear 4.5:1');
