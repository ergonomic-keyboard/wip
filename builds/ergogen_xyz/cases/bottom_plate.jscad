function board_extrude_1_outline_fn(){
    return new CSG.Path2D([[-8.0446471,-8.07983],[5.8509991,-9.7860008]]).appendArc([8.07983,-8.0446471],{"radius":2,"clockwise":false,"large":false}).appendPoint([8.6891767,-3.0819165]).appendArc([10.9180078,-1.3405628],{"radius":2,"clockwise":true,"large":false}).appendPoint([18.8583769,-2.3155176]).appendPoint([19.1006939,-0.3420039]).appendPoint([26.758659,-1.9697546]).appendArc([29.1307776,-0.4292828],{"radius":2,"clockwise":false,"large":false}).appendPoint([29.7545126,2.50516]).appendPoint([49.3174646,-1.6530738]).appendPoint([48.2779062,-6.5438118]).appendArc([49.818378,-8.9159304],{"radius":2,"clockwise":false,"large":false}).appendPoint([63.9684711,-11.9236255]).appendPoint([61.7844651,-14.5264225]).appendPoint([60.9324141,-14.3453135]).appendArc([58.5602955,-15.8857853],{"radius":2,"clockwise":false,"large":false}).appendPoint([57.8534523,-19.2112211]).appendPoint([47.6073176,-31.422089]).appendPoint([99.6983398,-75.1316464]).appendPoint([109.9444749,-62.9207781]).appendPoint([113.0966471,-61.6472179]).appendArc([114.2018016,-59.043637],{"radius":2,"clockwise":false,"large":false}).appendPoint([113.8754871,-58.2359802]).appendPoint([119.1920064,-51.8999992]).appendPoint([124.5085257,-58.2359802]).appendPoint([124.1822112,-59.043637]).appendArc([125.2873657,-61.6472179],{"radius":2,"clockwise":false,"large":false}).appendPoint([128.4395379,-62.9207781]).appendPoint([138.685673,-75.1316464]).appendPoint([190.7766952,-31.422089]).appendPoint([180.5305605,-19.2112211]).appendPoint([179.8237173,-15.8857853]).appendArc([177.4515987,-14.3453135],{"radius":2,"clockwise":false,"large":false}).appendPoint([176.5995477,-14.5264225]).appendPoint([174.4155417,-11.9236255]).appendPoint([188.5656348,-8.9159304]).appendArc([190.1061066,-6.5438118],{"radius":2,"clockwise":false,"large":false}).appendPoint([189.0665482,-1.6530738]).appendPoint([208.6295002,2.50516]).appendPoint([209.2532352,-0.4292828]).appendArc([211.6253538,-1.9697546],{"radius":2,"clockwise":false,"large":false}).appendPoint([219.2833189,-0.3420039]).appendPoint([219.5256359,-2.3155176]).appendPoint([227.466005,-1.3405628]).appendArc([229.6948361,-3.0819165],{"radius":2,"clockwise":true,"large":false}).appendPoint([230.3041828,-8.0446471]).appendArc([232.5330137,-9.7860008],{"radius":2,"clockwise":false,"large":false}).appendPoint([246.4286599,-8.07983]).appendArc([248.1700136,-5.8509991],{"radius":2,"clockwise":false,"large":false}).appendPoint([241.8328077,45.7614008]).appendArc([239.6039768,47.5027545],{"radius":2,"clockwise":false,"large":false}).appendPoint([229.812522,46.300515]).appendArc([227.6124882,47.869784],{"radius":2,"clockwise":true,"large":false}).appendPoint([227.2853419,49.4088865]).appendPoint([219.4601611,47.745593]).appendArc([217.0880425,49.2860648],{"radius":2,"clockwise":true,"large":false}).appendPoint([216.0484841,54.1768028]).appendArc([213.6763655,55.7172746],{"radius":2,"clockwise":false,"large":false}).appendPoint([197.0478563,52.1827759]).appendPoint([196.4241213,55.1172187]).appendArc([194.0520027,56.6576905],{"radius":2,"clockwise":false,"large":false}).appendPoint([180.3579363,53.7469269]).appendArc([178.8174645,51.3748083],{"radius":2,"clockwise":false,"large":false}).appendPoint([179.8570229,46.4840703]).appendPoint([163.2285137,42.9495716]).appendArc([161.6880419,40.577453],{"radius":2,"clockwise":false,"large":false}).appendPoint([145.0595326,37.0429542]).appendArc([143.5190608,34.6708356],{"radius":2,"clockwise":false,"large":false}).appendPoint([144.9744426,27.8238024]).appendPoint([147.2882407,16.9382386]).appendPoint([119.1920064,-6.6373011]).appendPoint([91.0957721,16.9382386]).appendPoint([93.4095701,27.8238024]).appendPoint([94.864952,34.6708356]).appendArc([93.3244802,37.0429542],{"radius":2,"clockwise":false,"large":false}).appendPoint([76.6959709,40.5774529]).appendArc([75.1554991,42.9495716],{"radius":2,"clockwise":false,"large":false}).appendPoint([58.5269899,46.4840703]).appendPoint([59.5665483,51.3748083]).appendArc([58.0260765,53.7469269],{"radius":2,"clockwise":false,"large":false}).appendPoint([44.3320101,56.6576905]).appendArc([41.9598915,55.1172187],{"radius":2,"clockwise":false,"large":false}).appendPoint([41.3361565,52.1827759]).appendPoint([24.7076473,55.7172746]).appendArc([22.3355287,54.1768028],{"radius":2,"clockwise":false,"large":false}).appendPoint([21.2959703,49.2860648]).appendArc([18.9238517,47.745593],{"radius":2,"clockwise":true,"large":false}).appendPoint([13.0549661,48.9930631]).appendArc([10.6828475,47.4525913],{"radius":2,"clockwise":false,"large":false}).appendPoint([10.3904926,46.0771697]).appendPoint([-1.219964,47.5027545]).appendArc([-3.4487949,45.7614008],{"radius":2,"clockwise":false,"large":false}).appendPoint([-9.7860008,-5.8509991]).appendArc([-8.0446471,-8.07983],{"radius":2,"clockwise":false,"large":false}).close().innerToCAG()
.extrude({ offset: [0, 0, 1] });
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

        