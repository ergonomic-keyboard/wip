function board_extrude_1_2_outline_fn(){
    return new CSG.Path2D([[92.5,-109.5],[109.5,-109.5]]).appendPoint([109.5,-107.5]).appendPoint([125.5,-107.5]).appendArc([127.5,-105.5],{"radius":2,"clockwise":false,"large":false}).appendPoint([127.5,-104.5]).appendArc([129.5,-102.5],{"radius":2,"clockwise":true,"large":false}).appendPoint([143.5,-102.5]).appendArc([145.5,-100.5],{"radius":2,"clockwise":false,"large":false}).appendPoint([145.5,-100]).appendPoint([160.5,-100]).appendArc([162.5,-102],{"radius":2,"clockwise":true,"large":false}).appendPoint([162.5,-102.3836488]).appendPoint([162.2635995,-102.3419651]).appendArc([159.9466876,-103.9642841],{"radius":2,"clockwise":false,"large":false}).appendPoint([158.2793627,-113.4201542]).appendArc([157.3097472,-114.8049086],{"radius":2,"clockwise":true,"large":false}).appendPoint([152.1138028,-117.8047885]).appendArc([151.381752,-120.5368393],{"radius":2,"clockwise":false,"large":false}).appendPoint([158.881752,-133.5272203]).appendArc([161.6138028,-134.2592711],{"radius":2,"clockwise":false,"large":false}).appendPoint([174.1330832,-127.0312612]).appendPoint([174.5955719,-128.3019385]).appendPoint([182.3159598,-125.4919471]).appendArc([183.6840402,-125.491947],{"radius":2,"clockwise":true,"large":false}).appendPoint([191.4044281,-128.3019385]).appendPoint([191.8669168,-127.0312612]).appendPoint([204.3861972,-134.2592711]).appendArc([207.118248,-133.5272203],{"radius":2,"clockwise":false,"large":false}).appendPoint([214.618248,-120.5368393]).appendArc([213.8861972,-117.8047885],{"radius":2,"clockwise":false,"large":false}).appendPoint([208.6902528,-114.8049086]).appendArc([207.7206373,-113.4201542],{"radius":2,"clockwise":true,"large":false}).appendPoint([206.0533123,-103.9642842]).appendArc([203.7364005,-102.341965],{"radius":2,"clockwise":false,"large":false}).appendPoint([203.5,-102.3836488]).appendPoint([203.5,-102]).appendArc([205.5,-100],{"radius":2,"clockwise":true,"large":false}).appendPoint([218.5,-100]).appendArc([220.5,-102],{"radius":2,"clockwise":true,"large":false}).appendPoint([220.5,-102.5]).appendPoint([236.5,-102.5]).appendArc([238.5,-104.5],{"radius":2,"clockwise":true,"large":false}).appendPoint([238.5,-105.5]).appendArc([240.5,-107.5],{"radius":2,"clockwise":false,"large":false}).appendPoint([256.5,-107.5]).appendPoint([256.5,-109.5]).appendPoint([273.5,-109.5]).appendArc([275.5,-107.5],{"radius":2,"clockwise":false,"large":false}).appendPoint([275.5,-54.5]).appendArc([273.5,-52.5],{"radius":2,"clockwise":false,"large":false}).appendPoint([257.5,-52.5]).appendPoint([257.5,-50.5]).appendPoint([241.5,-50.5]).appendArc([239.5,-48.5],{"radius":2,"clockwise":true,"large":false}).appendPoint([239.5,-47.5]).appendArc([237.5,-45.5],{"radius":2,"clockwise":false,"large":false}).appendPoint([223.5,-45.5]).appendArc([221.5,-43.5],{"radius":2,"clockwise":true,"large":false}).appendPoint([221.5,-43]).appendPoint([204.5,-43]).appendArc([202.5,-45],{"radius":2,"clockwise":false,"large":false}).appendPoint([202.5,-45.5]).appendPoint([186.5,-45.5]).appendArc([184.5,-47.5],{"radius":2,"clockwise":false,"large":false}).appendPoint([184.5,-100.5]).appendArc([186.5,-102.5],{"radius":2,"clockwise":false,"large":false}).appendPoint([202.8401397,-102.5]).appendPoint([186.9946687,-105.293984]).appendPoint([187.2176734,-106.5587067]).appendPoint([186.8527124,-106.4258717]).appendPoint([186.6353892,-105.8287812]).appendArc([184.0719638,-104.6334361],{"radius":2,"clockwise":false,"large":false}).appendPoint([183,-105.0235991]).appendPoint([181.9280362,-104.6334362]).appendArc([179.3646107,-105.8287812],{"radius":2,"clockwise":false,"large":false}).appendPoint([179.1472876,-106.4258717]).appendPoint([178.7823266,-106.5587067]).appendPoint([179.0053313,-105.293984]).appendPoint([163.1598603,-102.5]).appendPoint([179.5,-102.5]).appendArc([181.5,-100.5],{"radius":2,"clockwise":false,"large":false}).appendPoint([181.5,-47.5]).appendArc([179.5,-45.5],{"radius":2,"clockwise":false,"large":false}).appendPoint([165.5,-45.5]).appendArc([163.5,-43.5],{"radius":2,"clockwise":true,"large":false}).appendPoint([163.5,-43]).appendPoint([146.5,-43]).appendArc([144.5,-45],{"radius":2,"clockwise":false,"large":false}).appendPoint([144.5,-45.5]).appendPoint([128.5,-45.5]).appendArc([126.5,-47.5],{"radius":2,"clockwise":false,"large":false}).appendPoint([126.5,-48.5]).appendArc([124.5,-50.5],{"radius":2,"clockwise":true,"large":false}).appendPoint([108.5,-50.5]).appendPoint([108.5,-52.5]).appendPoint([92.5,-52.5]).appendArc([90.5,-54.5],{"radius":2,"clockwise":false,"large":false}).appendPoint([90.5,-107.5]).appendArc([92.5,-109.5],{"radius":2,"clockwise":false,"large":false}).close().innerToCAG()
.extrude({ offset: [0, 0, 1.2] });
}




                function bottom_plate_case_fn() {
                    

                // creating part 0 of case bottom_plate
                let bottom_plate__part_0 = board_extrude_1_2_outline_fn();

                // make sure that rotations are relative
                let bottom_plate__part_0_bounds = bottom_plate__part_0.getBounds();
                let bottom_plate__part_0_x = bottom_plate__part_0_bounds[0].x + (bottom_plate__part_0_bounds[1].x - bottom_plate__part_0_bounds[0].x) / 2
                let bottom_plate__part_0_y = bottom_plate__part_0_bounds[0].y + (bottom_plate__part_0_bounds[1].y - bottom_plate__part_0_bounds[0].y) / 2
                bottom_plate__part_0 = translate([-bottom_plate__part_0_x, -bottom_plate__part_0_y, 0], bottom_plate__part_0);
                bottom_plate__part_0 = rotate([0,0,0], bottom_plate__part_0);
                bottom_plate__part_0 = translate([bottom_plate__part_0_x, bottom_plate__part_0_y, 0], bottom_plate__part_0);

                bottom_plate__part_0 = translate([0,0,0], bottom_plate__part_0);
                let result = bottom_plate__part_0;
                
            
                    return result;
                }
            
            
        
            function main() {
                return bottom_plate_case_fn();
            }

        