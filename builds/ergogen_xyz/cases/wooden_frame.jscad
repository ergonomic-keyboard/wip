function frame_extrude_4_8_outline_fn(){
    return new CSG.Path2D([[-14.4874014,-11.3187985],[11.3187985,-14.4874014]]).appendPoint([12.4156226,-5.5544862]).appendPoint([22.3410841,-6.7731796]).appendPoint([22.5388903,-5.1621775]).appendPoint([31.7958978,-7.1298152]).appendPoint([32.8354563,-2.2390772]).appendPoint([44.5732274,-4.7340175]).appendPoint([43.1178456,-11.5810506]).appendPoint([45.0741409,-11.996874]).appendArc([52.6531229,-19.1858371],{"radius":10,"clockwise":true,"large":false}).appendPoint([48.3998656,-24.2546717]).appendArc([49.6324336,-38.3429923],{"radius":10,"clockwise":false,"large":false}).appendPoint([92.5309225,-74.3390984]).appendArc([106.6192431,-73.1065304],{"radius":10,"clockwise":false,"large":false}).appendPoint([106.7915957,-72.9011284]).appendPoint([115.9073221,1.3405054]).appendPoint([96.5559295,17.5782518]).appendArc([95.4874217,18.3603882],{"radius":10,"clockwise":false,"large":false}).appendPoint([100.0250126,39.7080744]).appendPoint([81.4402081,43.6583966]).appendPoint([81.8560315,45.6146918]).appendPoint([63.2712271,49.565014]).appendPoint([64.7266089,56.4120471]).appendPoint([39.2947713,61.8177511]).appendPoint([38.2552128,56.9270131]).appendPoint([19.6704085,60.8773352]).appendPoint([17.7992033,52.0740068]).appendPoint([8.0177273,54.1531237]).appendPoint([7.2399661,50.494045]).appendPoint([-6.6877634,52.2041551]).appendPoint([-14.4874014,-11.3187985]).close().innerToCAG()
.union(
    new CSG.Path2D([[112.3675928,-66.2559139],[115.4459406,-65.0121806]]).appendArc([122.9380722,-65.0121806],{"radius":10,"clockwise":true,"large":false}).appendPoint([126.01642,-66.2559139]).appendPoint([131.7647697,-73.1065303]).appendArc([145.8530903,-74.3390984],{"radius":10,"clockwise":false,"large":false}).appendPoint([188.7515791,-38.3429923]).appendArc([189.9841472,-24.2546717],{"radius":10,"clockwise":false,"large":false}).appendPoint([185.7308899,-19.1858371]).appendArc([193.3098719,-11.996874],{"radius":10,"clockwise":true,"large":false}).appendPoint([195.2661672,-11.5810506]).appendPoint([193.8107854,-4.7340175]).appendPoint([205.5485565,-2.2390772]).appendPoint([206.588115,-7.1298152]).appendPoint([215.8451225,-5.1621775]).appendPoint([216.0429287,-6.7731796]).appendPoint([225.9683902,-5.5544862]).appendPoint([227.0652143,-14.4874014]).appendPoint([252.8714142,-11.3187985]).appendPoint([245.0717762,52.2041551]).appendPoint([231.1440467,50.494045]).appendPoint([230.3662855,54.1531237]).appendPoint([220.5848095,52.0740068]).appendPoint([218.7136043,60.8773352]).appendPoint([200.1288,56.9270131]).appendPoint([199.0892415,61.8177511]).appendPoint([173.6574039,56.4120471]).appendPoint([175.1127857,49.565014]).appendPoint([156.5279813,45.6146918]).appendPoint([156.9438047,43.6583966]).appendPoint([138.3590002,39.7080744]).appendPoint([142.8965911,18.3603882]).appendArc([141.8280833,17.5782518],{"radius":10,"clockwise":false,"large":false}).appendPoint([119.6456874,-1.0349884]).appendPoint([111.5124297,-67.2750576]).appendPoint([112.3675928,-66.2559139]).close().innerToCAG()
.subtract(
    new CSG.Path2D([[119.1920064,-60.7169585],[118.4845679,-58.9659868]]).appendPoint([119.1920064,-58.1228945]).appendPoint([119.8994449,-58.9659868]).appendPoint([119.1920064,-60.7169585]).close().innerToCAG()
)).extrude({ offset: [0, 0, 4.8] });
}


function board_extrude_4_8_outline_fn(){
    return new CSG.Path2D([[-2.0893699,-8.8110461],[-0.1042775,-9.0547848]]).appendArc([8.8110461,-2.0893699],{"radius":8,"clockwise":false,"large":false}).appendPoint([8.9329154,-1.0968241]).appendPoint([18.8583769,-2.3155176]).appendPoint([19.1006939,-0.3420039]).appendPoint([28.7149542,-2.385578]).appendPoint([29.7545126,2.50516]).appendPoint([49.3174646,-1.6530738]).appendPoint([47.8620828,-8.500107]).appendPoint([63.9684711,-11.9236255]).appendPoint([52.7496186,-25.2937333]).appendArc([53.735673,-36.5643897],{"radius":8,"clockwise":false,"large":false}).appendPoint([93.5699841,-69.9893454]).appendArc([104.8406406,-69.003291],{"radius":8,"clockwise":false,"large":false}).appendPoint([107.6866424,-65.611558]).appendPoint([115.326072,-3.393397]).appendPoint([95.5168679,13.2284988]).appendArc([90.7036337,15.0933727],{"radius":8,"clockwise":false,"large":false}).appendPoint([93.4095701,27.8238024]).appendPoint([93.6174819,28.8019499]).appendArc([87.4555947,38.2904243],{"radius":8,"clockwise":false,"large":false}).appendPoint([76.6959709,40.5774529]).appendPoint([77.1117943,42.5337482]).appendPoint([58.5269899,46.4840703]).appendPoint([59.9823717,53.3311035]).appendPoint([42.3757149,57.0735139]).appendPoint([41.3361565,52.1827759]).appendPoint([30.576533,54.4698045]).appendArc([21.0880586,48.3079173],{"radius":8,"clockwise":false,"large":false}).appendPoint([20.8801469,47.3297696]).appendPoint([11.0986709,49.4088865]).appendPoint([10.3904926,46.0771697]).appendPoint([4.7353126,46.7715385]).appendArc([-4.180011,39.8061236],{"radius":8,"clockwise":false,"large":false}).appendPoint([-9.0547848,0.1042775]).appendArc([-2.0893699,-8.8110461],{"radius":8,"clockwise":false,"large":false}).close().innerToCAG()
.union(
    new CSG.Path2D([[230.5479215,-10.0297395],[240.4733827,-8.8110461]]).appendArc([247.4387976,0.1042776],{"radius":8,"clockwise":false,"large":false}).appendPoint([242.5640238,39.8061236]).appendArc([233.6487001,46.7715385],{"radius":8,"clockwise":false,"large":false}).appendPoint([227.9935202,46.0771697]).appendPoint([227.2853419,49.4088865]).appendPoint([225.3290468,48.9930631]).appendArc([215.8405724,55.1549503],{"radius":8,"clockwise":true,"large":false}).appendPoint([215.6326607,56.133098]).appendPoint([197.0478563,52.1827759]).appendPoint([196.0082979,57.0735139]).appendPoint([178.4016411,53.3311035]).appendPoint([179.8570229,46.4840703]).appendPoint([161.2722185,42.5337482]).appendPoint([161.6880419,40.5774529]).appendPoint([150.9284181,38.2904243]).appendArc([144.7665309,28.8019499],{"radius":8,"clockwise":false,"large":false}).appendPoint([144.9744426,27.8238024]).appendPoint([147.6803791,15.0933727]).appendArc([142.867145,13.2284988],{"radius":8,"clockwise":false,"large":false}).appendPoint([119.1920064,-6.6373011]).appendPoint([118.9796851,-6.4591424]).appendPoint([112.4074764,-59.9854872]).appendPoint([119.1920064,-51.8999992]).appendPoint([133.5433722,-69.0032909]).appendArc([144.8140286,-69.9893454],{"radius":8,"clockwise":false,"large":false}).appendPoint([184.6483398,-36.5643898]).appendArc([185.6343942,-25.2937333],{"radius":8,"clockwise":false,"large":false}).appendPoint([174.4155417,-11.9236255]).appendPoint([190.52193,-8.500107]).appendPoint([189.0665482,-1.6530738]).appendPoint([208.6295002,2.50516]).appendPoint([209.6690586,-2.385578]).appendPoint([219.2833189,-0.3420039]).appendPoint([219.5256359,-2.3155176]).appendPoint([221.5107278,-2.0717789]).appendArc([230.4260523,-9.0371937],{"radius":8,"clockwise":true,"large":false}).appendPoint([230.5479215,-10.0297395]).close().innerToCAG()
).extrude({ offset: [0, 0, 4.8] });
}




                function wooden_frame_case_fn() {
                    

                // creating part 0 of case wooden_frame
                let wooden_frame__part_0 = frame_extrude_4_8_outline_fn();

                // make sure that rotations are relative
                let wooden_frame__part_0_bounds = wooden_frame__part_0.getBounds();
                let wooden_frame__part_0_x = wooden_frame__part_0_bounds[0].x + (wooden_frame__part_0_bounds[1].x - wooden_frame__part_0_bounds[0].x) / 2
                let wooden_frame__part_0_y = wooden_frame__part_0_bounds[0].y + (wooden_frame__part_0_bounds[1].y - wooden_frame__part_0_bounds[0].y) / 2
                wooden_frame__part_0 = translate([-wooden_frame__part_0_x, -wooden_frame__part_0_y, 0], wooden_frame__part_0);
                wooden_frame__part_0 = rotate([0,0,0], wooden_frame__part_0);
                wooden_frame__part_0 = translate([wooden_frame__part_0_x, wooden_frame__part_0_y, 0], wooden_frame__part_0);

                wooden_frame__part_0 = translate([0,0,0], wooden_frame__part_0);
                let result = wooden_frame__part_0;
                
            

                // creating part 1 of case wooden_frame
                let wooden_frame__part_1 = board_extrude_4_8_outline_fn();

                // make sure that rotations are relative
                let wooden_frame__part_1_bounds = wooden_frame__part_1.getBounds();
                let wooden_frame__part_1_x = wooden_frame__part_1_bounds[0].x + (wooden_frame__part_1_bounds[1].x - wooden_frame__part_1_bounds[0].x) / 2
                let wooden_frame__part_1_y = wooden_frame__part_1_bounds[0].y + (wooden_frame__part_1_bounds[1].y - wooden_frame__part_1_bounds[0].y) / 2
                wooden_frame__part_1 = translate([-wooden_frame__part_1_x, -wooden_frame__part_1_y, 0], wooden_frame__part_1);
                wooden_frame__part_1 = rotate([0,0,0], wooden_frame__part_1);
                wooden_frame__part_1 = translate([wooden_frame__part_1_x, wooden_frame__part_1_y, 0], wooden_frame__part_1);

                wooden_frame__part_1 = translate([0,0,0], wooden_frame__part_1);
                result = result.subtract(wooden_frame__part_1);
                
            
                    return result;
                }
            
            
        
            function main() {
                return wooden_frame_case_fn();
            }

        