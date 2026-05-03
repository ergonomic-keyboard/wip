function board_extrude_1_outline_fn(){
    return new CSG.Path2D([[-2.0893699,-8.8110461],[-0.1042775,-9.0547848]]).appendArc([8.8110461,-2.0893699],{"radius":8,"clockwise":false,"large":false}).appendPoint([8.9329154,-1.0968241]).appendPoint([18.8583769,-2.3155176]).appendPoint([19.1006939,-0.3420039]).appendPoint([28.7149542,-2.385578]).appendPoint([29.7545126,2.50516]).appendPoint([49.3174646,-1.6530738]).appendPoint([47.8620828,-8.500107]).appendPoint([63.9684711,-11.9236255]).appendPoint([52.7496186,-25.2937333]).appendArc([53.735673,-36.5643897],{"radius":8,"clockwise":false,"large":false}).appendPoint([93.5699841,-69.9893454]).appendArc([104.8406406,-69.003291],{"radius":8,"clockwise":false,"large":false}).appendPoint([107.6866424,-65.611558]).appendPoint([115.326072,-3.393397]).appendPoint([95.5168679,13.2284988]).appendArc([90.7036337,15.0933727],{"radius":8,"clockwise":false,"large":false}).appendPoint([93.4095701,27.8238024]).appendPoint([93.6174819,28.8019499]).appendArc([87.4555947,38.2904243],{"radius":8,"clockwise":false,"large":false}).appendPoint([76.6959709,40.5774529]).appendPoint([77.1117943,42.5337482]).appendPoint([58.5269899,46.4840703]).appendPoint([59.9823717,53.3311035]).appendPoint([42.3757149,57.0735139]).appendPoint([41.3361565,52.1827759]).appendPoint([30.576533,54.4698045]).appendArc([21.0880586,48.3079173],{"radius":8,"clockwise":false,"large":false}).appendPoint([20.8801469,47.3297696]).appendPoint([11.0986709,49.4088865]).appendPoint([10.3904926,46.0771697]).appendPoint([4.7353126,46.7715385]).appendArc([-4.180011,39.8061236],{"radius":8,"clockwise":false,"large":false}).appendPoint([-9.0547848,0.1042775]).appendArc([-2.0893699,-8.8110461],{"radius":8,"clockwise":false,"large":false}).close().innerToCAG()
.union(
    new CSG.Path2D([[230.5479215,-10.0297395],[240.4733827,-8.8110461]]).appendArc([247.4387976,0.1042776],{"radius":8,"clockwise":false,"large":false}).appendPoint([242.5640238,39.8061236]).appendArc([233.6487001,46.7715385],{"radius":8,"clockwise":false,"large":false}).appendPoint([227.9935202,46.0771697]).appendPoint([227.2853419,49.4088865]).appendPoint([225.3290468,48.9930631]).appendArc([215.8405724,55.1549503],{"radius":8,"clockwise":true,"large":false}).appendPoint([215.6326607,56.133098]).appendPoint([197.0478563,52.1827759]).appendPoint([196.0082979,57.0735139]).appendPoint([178.4016411,53.3311035]).appendPoint([179.8570229,46.4840703]).appendPoint([161.2722185,42.5337482]).appendPoint([161.6880419,40.5774529]).appendPoint([150.9284181,38.2904243]).appendArc([144.7665309,28.8019499],{"radius":8,"clockwise":false,"large":false}).appendPoint([144.9744426,27.8238024]).appendPoint([147.6803791,15.0933727]).appendArc([142.867145,13.2284988],{"radius":8,"clockwise":false,"large":false}).appendPoint([119.1920064,-6.6373011]).appendPoint([118.9796851,-6.4591424]).appendPoint([112.4074764,-59.9854872]).appendPoint([119.1920064,-51.8999992]).appendPoint([133.5433722,-69.0032909]).appendArc([144.8140286,-69.9893454],{"radius":8,"clockwise":false,"large":false}).appendPoint([184.6483398,-36.5643898]).appendArc([185.6343942,-25.2937333],{"radius":8,"clockwise":false,"large":false}).appendPoint([174.4155417,-11.9236255]).appendPoint([190.52193,-8.500107]).appendPoint([189.0665482,-1.6530738]).appendPoint([208.6295002,2.50516]).appendPoint([209.6690586,-2.385578]).appendPoint([219.2833189,-0.3420039]).appendPoint([219.5256359,-2.3155176]).appendPoint([221.5107278,-2.0717789]).appendArc([230.4260523,-9.0371937],{"radius":8,"clockwise":true,"large":false}).appendPoint([230.5479215,-10.0297395]).close().innerToCAG()
).extrude({ offset: [0, 0, 1] });
}




                function bottom_plate_case_fn() {
                    

                // creating part 0 of case bottom_plate
                let bottom_plate__part_0 = board_extrude_1_outline_fn();

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

        