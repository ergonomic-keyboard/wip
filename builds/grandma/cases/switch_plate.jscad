function board_extrude_1_5_outline_fn(){
    return new CSG.Path2D([[92.5,-109.5],[109.5,-109.5]]).appendPoint([109.5,-107.5]).appendPoint([125.5,-107.5]).appendArc([127.5,-105.5],{"radius":2,"clockwise":false,"large":false}).appendPoint([127.5,-104.5]).appendArc([129.5,-102.5],{"radius":2,"clockwise":true,"large":false}).appendPoint([143.5,-102.5]).appendArc([145.5,-100.5],{"radius":2,"clockwise":false,"large":false}).appendPoint([145.5,-100]).appendPoint([160.5,-100]).appendArc([162.5,-102],{"radius":2,"clockwise":true,"large":false}).appendPoint([162.5,-102.3836488]).appendPoint([162.2635995,-102.3419651]).appendArc([159.9466876,-103.9642841],{"radius":2,"clockwise":false,"large":false}).appendPoint([158.2793627,-113.4201542]).appendArc([157.3097472,-114.8049086],{"radius":2,"clockwise":true,"large":false}).appendPoint([152.1138028,-117.8047885]).appendArc([151.381752,-120.5368393],{"radius":2,"clockwise":false,"large":false}).appendPoint([158.881752,-133.5272203]).appendArc([161.6138028,-134.2592711],{"radius":2,"clockwise":false,"large":false}).appendPoint([174.1330832,-127.0312612]).appendPoint([174.5955719,-128.3019385]).appendPoint([182.3159598,-125.4919471]).appendArc([183.6840402,-125.491947],{"radius":2,"clockwise":true,"large":false}).appendPoint([191.4044281,-128.3019385]).appendPoint([191.8669168,-127.0312612]).appendPoint([204.3861972,-134.2592711]).appendArc([207.118248,-133.5272203],{"radius":2,"clockwise":false,"large":false}).appendPoint([214.618248,-120.5368393]).appendArc([213.8861972,-117.8047885],{"radius":2,"clockwise":false,"large":false}).appendPoint([208.6902528,-114.8049086]).appendArc([207.7206373,-113.4201542],{"radius":2,"clockwise":true,"large":false}).appendPoint([206.0533123,-103.9642842]).appendArc([203.7364005,-102.341965],{"radius":2,"clockwise":false,"large":false}).appendPoint([203.5,-102.3836488]).appendPoint([203.5,-102]).appendArc([205.5,-100],{"radius":2,"clockwise":true,"large":false}).appendPoint([218.5,-100]).appendArc([220.5,-102],{"radius":2,"clockwise":true,"large":false}).appendPoint([220.5,-102.5]).appendPoint([236.5,-102.5]).appendArc([238.5,-104.5],{"radius":2,"clockwise":true,"large":false}).appendPoint([238.5,-105.5]).appendArc([240.5,-107.5],{"radius":2,"clockwise":false,"large":false}).appendPoint([256.5,-107.5]).appendPoint([256.5,-109.5]).appendPoint([273.5,-109.5]).appendArc([275.5,-107.5],{"radius":2,"clockwise":false,"large":false}).appendPoint([275.5,-54.5]).appendArc([273.5,-52.5],{"radius":2,"clockwise":false,"large":false}).appendPoint([257.5,-52.5]).appendPoint([257.5,-50.5]).appendPoint([241.5,-50.5]).appendArc([239.5,-48.5],{"radius":2,"clockwise":true,"large":false}).appendPoint([239.5,-47.5]).appendArc([237.5,-45.5],{"radius":2,"clockwise":false,"large":false}).appendPoint([223.5,-45.5]).appendArc([221.5,-43.5],{"radius":2,"clockwise":true,"large":false}).appendPoint([221.5,-43]).appendPoint([204.5,-43]).appendArc([202.5,-45],{"radius":2,"clockwise":false,"large":false}).appendPoint([202.5,-45.5]).appendPoint([186.5,-45.5]).appendArc([184.5,-47.5],{"radius":2,"clockwise":false,"large":false}).appendPoint([184.5,-100.5]).appendArc([186.5,-102.5],{"radius":2,"clockwise":false,"large":false}).appendPoint([202.8401397,-102.5]).appendPoint([186.9946687,-105.293984]).appendPoint([187.2176734,-106.5587067]).appendPoint([186.8527124,-106.4258717]).appendPoint([186.6353892,-105.8287812]).appendArc([184.0719638,-104.6334361],{"radius":2,"clockwise":false,"large":false}).appendPoint([183,-105.0235991]).appendPoint([181.9280362,-104.6334362]).appendArc([179.3646107,-105.8287812],{"radius":2,"clockwise":false,"large":false}).appendPoint([179.1472876,-106.4258717]).appendPoint([178.7823266,-106.5587067]).appendPoint([179.0053313,-105.293984]).appendPoint([163.1598603,-102.5]).appendPoint([179.5,-102.5]).appendArc([181.5,-100.5],{"radius":2,"clockwise":false,"large":false}).appendPoint([181.5,-47.5]).appendArc([179.5,-45.5],{"radius":2,"clockwise":false,"large":false}).appendPoint([165.5,-45.5]).appendArc([163.5,-43.5],{"radius":2,"clockwise":true,"large":false}).appendPoint([163.5,-43]).appendPoint([146.5,-43]).appendArc([144.5,-45],{"radius":2,"clockwise":false,"large":false}).appendPoint([144.5,-45.5]).appendPoint([128.5,-45.5]).appendArc([126.5,-47.5],{"radius":2,"clockwise":false,"large":false}).appendPoint([126.5,-48.5]).appendArc([124.5,-50.5],{"radius":2,"clockwise":true,"large":false}).appendPoint([108.5,-50.5]).appendPoint([108.5,-52.5]).appendPoint([92.5,-52.5]).appendArc([90.5,-54.5],{"radius":2,"clockwise":false,"large":false}).appendPoint([90.5,-107.5]).appendArc([92.5,-109.5],{"radius":2,"clockwise":false,"large":false}).close().innerToCAG()
.extrude({ offset: [0, 0, 1.5] });
}


function switch_cutouts_extrude_1_5_outline_fn(){
    return new CSG.Path2D([[111.1,-66.9],[124.9,-66.9]]).appendPoint([124.9,-53.1]).appendPoint([111.1,-53.1]).appendPoint([111.1,-66.9]).close().innerToCAG()
.union(
    new CSG.Path2D([[111.1,-85.9],[124.9,-85.9]]).appendPoint([124.9,-72.1]).appendPoint([111.1,-72.1]).appendPoint([111.1,-85.9]).close().innerToCAG()
).union(
    new CSG.Path2D([[111.1,-104.9],[124.9,-104.9]]).appendPoint([124.9,-91.1]).appendPoint([111.1,-91.1]).appendPoint([111.1,-104.9]).close().innerToCAG()
).union(
    new CSG.Path2D([[93.1,-68.9],[106.9,-68.9]]).appendPoint([106.9,-55.1]).appendPoint([93.1,-55.1]).appendPoint([93.1,-68.9]).close().innerToCAG()
).union(
    new CSG.Path2D([[93.1,-87.9],[106.9,-87.9]]).appendPoint([106.9,-74.1]).appendPoint([93.1,-74.1]).appendPoint([93.1,-87.9]).close().innerToCAG()
).union(
    new CSG.Path2D([[93.1,-106.9],[106.9,-106.9]]).appendPoint([106.9,-93.1]).appendPoint([93.1,-93.1]).appendPoint([93.1,-106.9]).close().innerToCAG()
).union(
    new CSG.Path2D([[187.1,-80.9],[200.9,-80.9]]).appendPoint([200.9,-67.1]).appendPoint([187.1,-67.1]).appendPoint([187.1,-80.9]).close().innerToCAG()
).union(
    new CSG.Path2D([[187.1,-99.9],[200.9,-99.9]]).appendPoint([200.9,-86.1]).appendPoint([187.1,-86.1]).appendPoint([187.1,-99.9]).close().innerToCAG()
).union(
    new CSG.Path2D([[205.1,-78.4],[218.9,-78.4]]).appendPoint([218.9,-64.6]).appendPoint([205.1,-64.6]).appendPoint([205.1,-78.4]).close().innerToCAG()
).union(
    new CSG.Path2D([[205.1,-97.4],[218.9,-97.4]]).appendPoint([218.9,-83.6]).appendPoint([205.1,-83.6]).appendPoint([205.1,-97.4]).close().innerToCAG()
).union(
    new CSG.Path2D([[223.1,-80.9],[236.9,-80.9]]).appendPoint([236.9,-67.1]).appendPoint([223.1,-67.1]).appendPoint([223.1,-80.9]).close().innerToCAG()
).union(
    new CSG.Path2D([[223.1,-99.9],[236.9,-99.9]]).appendPoint([236.9,-86.1]).appendPoint([223.1,-86.1]).appendPoint([223.1,-99.9]).close().innerToCAG()
).union(
    new CSG.Path2D([[241.1,-66.9],[254.9,-66.9]]).appendPoint([254.9,-53.1]).appendPoint([241.1,-53.1]).appendPoint([241.1,-66.9]).close().innerToCAG()
).union(
    new CSG.Path2D([[241.1,-85.9],[254.9,-85.9]]).appendPoint([254.9,-72.1]).appendPoint([241.1,-72.1]).appendPoint([241.1,-85.9]).close().innerToCAG()
).union(
    new CSG.Path2D([[241.1,-104.9],[254.9,-104.9]]).appendPoint([254.9,-91.1]).appendPoint([241.1,-91.1]).appendPoint([241.1,-104.9]).close().innerToCAG()
).union(
    new CSG.Path2D([[259.1,-68.9],[272.9,-68.9]]).appendPoint([272.9,-55.1]).appendPoint([259.1,-55.1]).appendPoint([259.1,-68.9]).close().innerToCAG()
).union(
    new CSG.Path2D([[259.1,-87.9],[272.9,-87.9]]).appendPoint([272.9,-74.1]).appendPoint([259.1,-74.1]).appendPoint([259.1,-87.9]).close().innerToCAG()
).union(
    new CSG.Path2D([[259.1,-106.9],[272.9,-106.9]]).appendPoint([272.9,-93.1]).appendPoint([259.1,-93.1]).appendPoint([259.1,-106.9]).close().innerToCAG()
).union(
    new CSG.Path2D([[165.1,-80.9],[178.9,-80.9]]).appendPoint([178.9,-67.1]).appendPoint([165.1,-67.1]).appendPoint([165.1,-80.9]).close().innerToCAG()
).union(
    new CSG.Path2D([[165.1,-99.9],[178.9,-99.9]]).appendPoint([178.9,-86.1]).appendPoint([165.1,-86.1]).appendPoint([165.1,-99.9]).close().innerToCAG()
).union(
    new CSG.Path2D([[147.1,-78.4],[160.9,-78.4]]).appendPoint([160.9,-64.6]).appendPoint([147.1,-64.6]).appendPoint([147.1,-78.4]).close().innerToCAG()
).union(
    new CSG.Path2D([[147.1,-97.4],[160.9,-97.4]]).appendPoint([160.9,-83.6]).appendPoint([147.1,-83.6]).appendPoint([147.1,-97.4]).close().innerToCAG()
).union(
    new CSG.Path2D([[129.1,-80.9],[142.9,-80.9]]).appendPoint([142.9,-67.1]).appendPoint([129.1,-67.1]).appendPoint([129.1,-80.9]).close().innerToCAG()
).union(
    new CSG.Path2D([[129.1,-99.9],[142.9,-99.9]]).appendPoint([142.9,-86.1]).appendPoint([129.1,-86.1]).appendPoint([129.1,-99.9]).close().innerToCAG()
).union(
    new CSG.Path2D([[187.1,-61.9],[200.9,-61.9]]).appendPoint([200.9,-48.1]).appendPoint([187.1,-48.1]).appendPoint([187.1,-61.9]).close().innerToCAG()
).union(
    new CSG.Path2D([[205.1,-59.4],[218.9,-59.4]]).appendPoint([218.9,-45.6]).appendPoint([205.1,-45.6]).appendPoint([205.1,-59.4]).close().innerToCAG()
).union(
    new CSG.Path2D([[223.1,-61.9],[236.9,-61.9]]).appendPoint([236.9,-48.1]).appendPoint([223.1,-48.1]).appendPoint([223.1,-61.9]).close().innerToCAG()
).union(
    new CSG.Path2D([[165.1,-61.9],[178.9,-61.9]]).appendPoint([178.9,-48.1]).appendPoint([165.1,-48.1]).appendPoint([165.1,-61.9]).close().innerToCAG()
).union(
    new CSG.Path2D([[147.1,-59.4],[160.9,-59.4]]).appendPoint([160.9,-45.6]).appendPoint([147.1,-45.6]).appendPoint([147.1,-59.4]).close().innerToCAG()
).union(
    new CSG.Path2D([[129.1,-61.9],[142.9,-61.9]]).appendPoint([142.9,-48.1]).appendPoint([129.1,-48.1]).appendPoint([129.1,-61.9]).close().innerToCAG()
).union(
    new CSG.Path2D([[170.2407283,-120.4015445],[173.5970011,-120.9933459]]).appendPoint([173.9577252,-118.9475778]).appendPoint([176.1495203,-124.9694853]).appendPoint([183,-122.4761146]).appendPoint([189.8504797,-124.9694853]).appendPoint([192.0422748,-118.9475778]).appendPoint([192.4029989,-120.9933459]).appendPoint([195.7592717,-120.4015445]).appendPoint([193.2154314,-124.8076051]).appendPoint([205.166582,-131.7076051]).appendPoint([212.066582,-119.7564545]).appendPoint([205.5326151,-115.984067]).appendPoint([203.5970011,-105.0066541]).appendPoint([190.0066541,-107.4029989]).appendPoint([190.560169,-110.5421378]).appendPoint([184.8241768,-108.4544073]).appendPoint([184.3974005,-107.2818491]).appendPoint([183,-107.7904613]).appendPoint([181.6025995,-107.2818491]).appendPoint([181.1758232,-108.4544073]).appendPoint([175.439831,-110.5421378]).appendPoint([175.9933459,-107.4029989]).appendPoint([162.4029989,-105.0066541]).appendPoint([160.4673849,-115.984067]).appendPoint([153.933418,-119.7564545]).appendPoint([160.833418,-131.7076051]).appendPoint([172.7845686,-124.8076051]).appendPoint([170.2407283,-120.4015445]).close().innerToCAG()
).extrude({ offset: [0, 0, 1.5] });
}




                function switch_plate_case_fn() {
                    

                // creating part 0 of case switch_plate
                let switch_plate__part_0 = board_extrude_1_5_outline_fn();

                // make sure that rotations are relative
                let switch_plate__part_0_bounds = switch_plate__part_0.getBounds();
                let switch_plate__part_0_x = switch_plate__part_0_bounds[0].x + (switch_plate__part_0_bounds[1].x - switch_plate__part_0_bounds[0].x) / 2
                let switch_plate__part_0_y = switch_plate__part_0_bounds[0].y + (switch_plate__part_0_bounds[1].y - switch_plate__part_0_bounds[0].y) / 2
                switch_plate__part_0 = translate([-switch_plate__part_0_x, -switch_plate__part_0_y, 0], switch_plate__part_0);
                switch_plate__part_0 = rotate([0,0,0], switch_plate__part_0);
                switch_plate__part_0 = translate([switch_plate__part_0_x, switch_plate__part_0_y, 0], switch_plate__part_0);

                switch_plate__part_0 = translate([0,0,0], switch_plate__part_0);
                let result = switch_plate__part_0;
                
            

                // creating part 1 of case switch_plate
                let switch_plate__part_1 = switch_cutouts_extrude_1_5_outline_fn();

                // make sure that rotations are relative
                let switch_plate__part_1_bounds = switch_plate__part_1.getBounds();
                let switch_plate__part_1_x = switch_plate__part_1_bounds[0].x + (switch_plate__part_1_bounds[1].x - switch_plate__part_1_bounds[0].x) / 2
                let switch_plate__part_1_y = switch_plate__part_1_bounds[0].y + (switch_plate__part_1_bounds[1].y - switch_plate__part_1_bounds[0].y) / 2
                switch_plate__part_1 = translate([-switch_plate__part_1_x, -switch_plate__part_1_y, 0], switch_plate__part_1);
                switch_plate__part_1 = rotate([0,0,0], switch_plate__part_1);
                switch_plate__part_1 = translate([switch_plate__part_1_x, switch_plate__part_1_y, 0], switch_plate__part_1);

                switch_plate__part_1 = translate([0,0,0], switch_plate__part_1);
                result = result.subtract(switch_plate__part_1);
                
            
                    return result;
                }
            
            
        
            function main() {
                return switch_plate_case_fn();
            }

        