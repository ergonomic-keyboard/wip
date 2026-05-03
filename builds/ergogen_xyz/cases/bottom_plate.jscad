function board_extrude_1_2_outline_fn(){
    return new CSG.Path2D([[57.1900037,-31.9519703],[70.8840701,-34.8627339]]).appendArc([73.2561887,-33.3222621],{"radius":2,"clockwise":false,"large":false}).appendPoint([76.1669523,-19.6281957]).appendArc([74.6264805,-17.2560771],{"radius":2,"clockwise":false,"large":false}).appendPoint([60.9324141,-14.3453135]).appendArc([58.5602955,-15.8857853],{"radius":2,"clockwise":false,"large":false}).appendPoint([55.6495319,-29.5798517]).appendArc([57.1900037,-31.9519703],{"radius":2,"clockwise":false,"large":false}).close().innerToCAG()
.union(
    new CSG.Path2D([[157.4999427,-34.8627339],[171.1940091,-31.9519703]]).appendArc([172.7344809,-29.5798517],{"radius":2,"clockwise":false,"large":false}).appendPoint([169.8237173,-15.8857853]).appendArc([167.4515987,-14.3453135],{"radius":2,"clockwise":false,"large":false}).appendPoint([153.7575323,-17.2560771]).appendArc([152.2170605,-19.6281957],{"radius":2,"clockwise":false,"large":false}).appendPoint([155.1278241,-33.3222621]).appendArc([157.4999427,-34.8627339],{"radius":2,"clockwise":false,"large":false}).close().innerToCAG()
).union(
    new CSG.Path2D([[140.6912403,-47.434781],[151.4158625,-38.4357544]]).appendArc([151.6623762,-35.6180902],{"radius":2,"clockwise":false,"large":false}).appendPoint([142.6633496,-24.8934681]).appendArc([139.8456854,-24.6469544],{"radius":2,"clockwise":false,"large":false}).appendPoint([129.1210633,-33.645981]).appendArc([128.8745496,-36.4636452],{"radius":2,"clockwise":false,"large":false}).appendPoint([137.8735762,-47.1882673]).appendArc([140.6912404,-47.434781],{"radius":2,"clockwise":false,"large":false}).close().innerToCAG()
).union(
    new CSG.Path2D([[76.9681503,-38.4357544],[87.6927725,-47.434781]]).appendArc([90.5104366,-47.1882674],{"radius":2,"clockwise":false,"large":false}).appendPoint([99.5094632,-36.4636451]).appendArc([99.2629496,-33.645981],{"radius":2,"clockwise":false,"large":false}).appendPoint([88.5383273,-24.6469544]).appendArc([85.7206632,-24.893468],{"radius":2,"clockwise":false,"large":false}).appendPoint([76.7216366,-35.6180903]).appendArc([76.9681502,-38.4357544],{"radius":2,"clockwise":false,"large":false}).close().innerToCAG()
).union(
    new CSG.Path2D([[92.268,-52.8059816],[97.5124922,-65.7865556]]).appendArc([100.1160731,-66.8917101],{"radius":2,"clockwise":false,"large":false}).appendPoint([113.4427932,-61.5073658]).appendArc([114.9412196,-61.5073658],{"radius":2,"clockwise":true,"large":false}).appendPoint([128.2679397,-66.8917101]).appendArc([130.8715206,-65.7865556],{"radius":2,"clockwise":false,"large":false}).appendPoint([136.1160128,-52.8059816]).appendArc([135.0108583,-50.2024007],{"radius":2,"clockwise":false,"large":false}).appendPoint([122.0302843,-44.9579085]).appendArc([119.4267034,-46.063063],{"radius":2,"clockwise":false,"large":false}).appendPoint([116.0463741,-54.4296718]).appendArc([112.3376387,-54.4296718],{"radius":2,"clockwise":true,"large":false}).appendPoint([108.9573094,-46.063063]).appendArc([106.3537285,-44.9579085],{"radius":2,"clockwise":false,"large":false}).appendPoint([93.3731545,-50.2024007]).appendArc([92.268,-52.8059816],{"radius":2,"clockwise":false,"large":false}).close().innerToCAG()
).union(
    new CSG.Path2D([[-8.0446471,-8.07983],[5.8509991,-9.7860008]]).appendArc([8.07983,-8.0446471],{"radius":2,"clockwise":false,"large":false}).appendPoint([8.6891767,-3.0819165]).appendArc([10.9180078,-1.3405628],{"radius":2,"clockwise":true,"large":false}).appendPoint([18.8583769,-2.3155176]).appendPoint([19.1006939,-0.3420039]).appendPoint([26.758659,-1.9697546]).appendArc([29.1307776,-0.4292828],{"radius":2,"clockwise":false,"large":false}).appendPoint([29.7545126,2.50516]).appendPoint([49.3174646,-1.6530738]).appendPoint([48.2779062,-6.5438118]).appendArc([49.818378,-8.9159304],{"radius":2,"clockwise":false,"large":false}).appendPoint([66.4468873,-12.4504291]).appendArc([67.9873591,-14.8225478],{"radius":2,"clockwise":false,"large":false}).appendPoint([81.6814255,-17.7333114]).appendArc([84.0535441,-16.1928396],{"radius":2,"clockwise":false,"large":false}).appendPoint([93.4095701,27.8238024]).appendPoint([94.864952,34.6708356]).appendArc([93.3244802,37.0429542],{"radius":2,"clockwise":false,"large":false}).appendPoint([76.6959709,40.5774529]).appendArc([75.1554991,42.9495716],{"radius":2,"clockwise":false,"large":false}).appendPoint([58.5269899,46.4840703]).appendPoint([59.5665483,51.3748083]).appendArc([58.0260765,53.7469269],{"radius":2,"clockwise":false,"large":false}).appendPoint([44.3320101,56.6576905]).appendArc([41.9598915,55.1172187],{"radius":2,"clockwise":false,"large":false}).appendPoint([41.3361565,52.1827759]).appendPoint([24.7076473,55.7172746]).appendArc([22.3355287,54.1768028],{"radius":2,"clockwise":false,"large":false}).appendPoint([21.2959703,49.2860648]).appendArc([18.9238517,47.745593],{"radius":2,"clockwise":true,"large":false}).appendPoint([13.0549661,48.9930631]).appendArc([10.6828475,47.4525913],{"radius":2,"clockwise":false,"large":false}).appendPoint([10.3904926,46.0771697]).appendPoint([-1.219964,47.5027545]).appendArc([-3.4487949,45.7614008],{"radius":2,"clockwise":false,"large":false}).appendPoint([-9.7860008,-5.8509991]).appendArc([-8.0446471,-8.07983],{"radius":2,"clockwise":false,"large":false}).close().innerToCAG()
).union(
    new CSG.Path2D([[222.5330137,-9.7860008],[236.4286599,-8.07983]]).appendArc([238.1700136,-5.8509991],{"radius":2,"clockwise":false,"large":false}).appendPoint([231.8328077,45.7614008]).appendArc([229.6039768,47.5027545],{"radius":2,"clockwise":false,"large":false}).appendPoint([219.812522,46.300515]).appendArc([217.6124882,47.869784],{"radius":2,"clockwise":true,"large":false}).appendPoint([217.2853419,49.4088865]).appendPoint([209.4601611,47.745593]).appendArc([207.0880425,49.2860648],{"radius":2,"clockwise":true,"large":false}).appendPoint([206.0484841,54.1768028]).appendArc([203.6763655,55.7172746],{"radius":2,"clockwise":false,"large":false}).appendPoint([187.0478563,52.1827759]).appendPoint([186.4241213,55.1172187]).appendArc([184.0520027,56.6576905],{"radius":2,"clockwise":false,"large":false}).appendPoint([170.3579363,53.7469269]).appendArc([168.8174645,51.3748083],{"radius":2,"clockwise":false,"large":false}).appendPoint([169.8570229,46.4840703]).appendPoint([153.2285137,42.9495716]).appendArc([151.6880419,40.577453],{"radius":2,"clockwise":false,"large":false}).appendPoint([135.0595326,37.0429542]).appendArc([133.5190608,34.6708356],{"radius":2,"clockwise":false,"large":false}).appendPoint([134.9744426,27.8238024]).appendPoint([144.3304687,-16.1928396]).appendArc([146.7025873,-17.7333114],{"radius":2,"clockwise":false,"large":false}).appendPoint([160.3966537,-14.8225478]).appendArc([161.9371255,-12.4504292],{"radius":2,"clockwise":false,"large":false}).appendPoint([178.5656348,-8.9159304]).appendArc([180.1061066,-6.5438118],{"radius":2,"clockwise":false,"large":false}).appendPoint([179.0665482,-1.6530738]).appendPoint([198.6295002,2.50516]).appendPoint([199.2532352,-0.4292828]).appendArc([201.6253538,-1.9697546],{"radius":2,"clockwise":false,"large":false}).appendPoint([209.2833189,-0.3420039]).appendPoint([209.5256359,-2.3155176]).appendPoint([217.466005,-1.3405628]).appendArc([219.6948361,-3.0819165],{"radius":2,"clockwise":true,"large":false}).appendPoint([220.3041828,-8.0446471]).appendArc([222.5330137,-9.7860008],{"radius":2,"clockwise":false,"large":false}).close().innerToCAG()
).extrude({ offset: [0, 0, 1.2] });
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

        