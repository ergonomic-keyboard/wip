// Cherry MX ULP (Ultra Low Profile) switch
// Based on Cherry_ULP_SMD from pashutk/Cherry_MX_ULP
// Nets
//    from: corresponds to pin 1
//    to: corresponds to pin 2
// Params
//    keycaps: default is false
//      if true, will add ULP sized keycap box (15x15mm)

module.exports = {
  params: {
    designator: 'S',
    keycaps: false,
    from: undefined,
    to: undefined
  },
  body: p => {
    const keycap = `
      ${'' /* keycap outline 15x15mm */}
      (fp_line (start -7.5 -7.5) (end 7.5 -7.5) (layer Dwgs.User) (width 0.15))
      (fp_line (start 7.5 -7.5) (end 7.5 7.5) (layer Dwgs.User) (width 0.15))
      (fp_line (start 7.5 7.5) (end -7.5 7.5) (layer Dwgs.User) (width 0.15))
      (fp_line (start -7.5 7.5) (end -7.5 -7.5) (layer Dwgs.User) (width 0.15))
      `
    return `
      (module Cherry_ULP_SMD (layer F.Cu) (tedit 5DD50112)
      ${p.at /* parametric position */}

      ${'' /* footprint reference */}
      (fp_text reference "${p.ref}" (at 0 -7.5) (layer F.SilkS) ${p.ref_hide} (effects (font (size 1 1) (thickness 0.15))))
      (fp_text value "" (at 0 0) (layer F.Fab) hide (effects (font (size 1 1) (thickness 0.15))))

      ${'' /* switch body outline */}
      (fp_line (start -7.1 -6.4) (end 7.1 -6.4) (layer F.SilkS) (width 0.1))
      (fp_line (start 7.1 -6.4) (end 7.1 6.4) (layer F.SilkS) (width 0.1))
      (fp_line (start 7.1 6.4) (end -7.1 6.4) (layer F.SilkS) (width 0.1))
      (fp_line (start -7.1 6.4) (end -7.1 -6.4) (layer F.SilkS) (width 0.1))

      ${'' /* courtyard */}
      (fp_line (start -6.8 -6.1) (end 6.8 -6.1) (layer F.CrtYd) (width 0.1))
      (fp_line (start 6.8 -6.1) (end 6.8 6.1) (layer F.CrtYd) (width 0.1))
      (fp_line (start 6.8 6.1) (end -6.8 6.1) (layer F.CrtYd) (width 0.1))
      (fp_line (start -6.8 6.1) (end -6.8 -6.1) (layer F.CrtYd) (width 0.1))

      ${'' /* alignment pins (non-plated) */}
      (pad "" np_thru_hole circle (at -5.8 1.2) (size 1.05 1.05) (drill 1.05) (layers *.Cu *.Mask))
      (pad "" np_thru_hole circle (at 5.8 -3.26) (size 1.2 1.2) (drill 1.2) (layers *.Cu *.Mask))
      (pad "" np_thru_hole circle (at 5.8 3.26) (size 1.2 1.2) (drill 1.2) (layers *.Cu *.Mask))

      ${'' /* switch contact pads */}
      (pad 1 smd rect (at -0.65 2.3) (size 0.7 3.4) (layers F.Cu F.Paste F.Mask) ${p.from})
      (pad 2 smd rect (at 1.8 2.3) (size 0.7 3.4) (layers F.Cu F.Paste F.Mask) ${p.to})

      ${'' /* ground/shield pads */}
      (pad 3 smd rect (at -6.2 -3.9) (size 1.6 3.8) (layers F.Cu F.Paste F.Mask))
      (pad 3 smd rect (at -6.2 4.5) (size 1.6 3) (layers F.Cu F.Paste F.Mask))
      (pad 3 smd rect (at 6.2 -5.025) (size 1.6 1.8) (layers F.Cu F.Paste F.Mask))
      (pad 3 smd rect (at 6.2 0) (size 1.6 2.6) (layers F.Cu F.Paste F.Mask))
      (pad 3 smd rect (at 6.2 5.025) (size 1.6 1.8) (layers F.Cu F.Paste F.Mask))

      ${p.keycaps ? keycap : ''}
      )
    `
  }
}
