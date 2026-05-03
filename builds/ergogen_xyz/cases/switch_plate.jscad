function board_extrude_1_2_outline_fn(){
    return new CSG.Path2D([[-8.0446471,-8.07983],[5.8509991,-9.7860008]]).appendArc([8.07983,-8.0446471],{"radius":2,"clockwise":false,"large":false}).appendPoint([8.6891767,-3.0819165]).appendArc([10.9180078,-1.3405628],{"radius":2,"clockwise":true,"large":false}).appendPoint([18.8583769,-2.3155176]).appendPoint([19.1006939,-0.3420039]).appendPoint([26.758659,-1.9697546]).appendArc([29.1307776,-0.4292828],{"radius":2,"clockwise":false,"large":false}).appendPoint([29.7545126,2.50516]).appendPoint([49.3174646,-1.6530738]).appendPoint([48.2779062,-6.5438118]).appendArc([49.818378,-8.9159304],{"radius":2,"clockwise":false,"large":false}).appendPoint([63.9684711,-11.9236255]).appendPoint([61.7844651,-14.5264225]).appendPoint([60.9324141,-14.3453135]).appendArc([58.5602955,-15.8857853],{"radius":2,"clockwise":false,"large":false}).appendPoint([57.8534523,-19.2112211]).appendPoint([47.6073176,-31.422089]).appendPoint([99.6983398,-75.1316464]).appendPoint([107.6866424,-65.611558]).appendPoint([115.326072,-3.393397]).appendPoint([91.0957721,16.9382386]).appendPoint([93.4095701,27.8238024]).appendPoint([94.864952,34.6708356]).appendArc([93.3244802,37.0429542],{"radius":2,"clockwise":false,"large":false}).appendPoint([76.6959709,40.5774529]).appendArc([75.1554991,42.9495716],{"radius":2,"clockwise":false,"large":false}).appendPoint([58.5269899,46.4840703]).appendPoint([59.5665483,51.3748083]).appendArc([58.0260765,53.7469269],{"radius":2,"clockwise":false,"large":false}).appendPoint([44.3320101,56.6576905]).appendArc([41.9598915,55.1172187],{"radius":2,"clockwise":false,"large":false}).appendPoint([41.3361565,52.1827759]).appendPoint([24.7076473,55.7172746]).appendArc([22.3355287,54.1768028],{"radius":2,"clockwise":false,"large":false}).appendPoint([21.2959703,49.2860648]).appendArc([18.9238517,47.745593],{"radius":2,"clockwise":true,"large":false}).appendPoint([13.0549661,48.9930631]).appendArc([10.6828475,47.4525913],{"radius":2,"clockwise":false,"large":false}).appendPoint([10.3904926,46.0771697]).appendPoint([-1.219964,47.5027545]).appendArc([-3.4487949,45.7614008],{"radius":2,"clockwise":false,"large":false}).appendPoint([-9.7860008,-5.8509991]).appendArc([-8.0446471,-8.07983],{"radius":2,"clockwise":false,"large":false}).close().innerToCAG()
.union(
    new CSG.Path2D([[112.1568183,-62.0269334],[113.0966471,-61.6472179]]).appendArc([114.2018016,-59.043637],{"radius":2,"clockwise":false,"large":false}).appendPoint([113.8754871,-58.2359802]).appendPoint([119.1920064,-51.8999992]).appendPoint([124.5085257,-58.2359802]).appendPoint([124.1822112,-59.043637]).appendArc([125.2873657,-61.6472179],{"radius":2,"clockwise":false,"large":false}).appendPoint([128.4395379,-62.9207781]).appendPoint([138.685673,-75.1316464]).appendPoint([190.7766952,-31.422089]).appendPoint([180.5305605,-19.2112211]).appendPoint([179.8237173,-15.8857853]).appendArc([177.4515987,-14.3453135],{"radius":2,"clockwise":false,"large":false}).appendPoint([176.5995477,-14.5264225]).appendPoint([174.4155417,-11.9236255]).appendPoint([188.5656348,-8.9159304]).appendArc([190.1061066,-6.5438118],{"radius":2,"clockwise":false,"large":false}).appendPoint([189.0665482,-1.6530738]).appendPoint([208.6295002,2.50516]).appendPoint([209.2532352,-0.4292828]).appendArc([211.6253538,-1.9697546],{"radius":2,"clockwise":false,"large":false}).appendPoint([219.2833189,-0.3420039]).appendPoint([219.5256359,-2.3155176]).appendPoint([227.466005,-1.3405628]).appendArc([229.6948361,-3.0819165],{"radius":2,"clockwise":true,"large":false}).appendPoint([230.3041828,-8.0446471]).appendArc([232.5330137,-9.7860008],{"radius":2,"clockwise":false,"large":false}).appendPoint([246.4286599,-8.07983]).appendArc([248.1700136,-5.8509991],{"radius":2,"clockwise":false,"large":false}).appendPoint([241.8328077,45.7614008]).appendArc([239.6039768,47.5027545],{"radius":2,"clockwise":false,"large":false}).appendPoint([229.812522,46.300515]).appendArc([227.6124882,47.869784],{"radius":2,"clockwise":true,"large":false}).appendPoint([227.2853419,49.4088865]).appendPoint([219.4601611,47.745593]).appendArc([217.0880425,49.2860648],{"radius":2,"clockwise":true,"large":false}).appendPoint([216.0484841,54.1768028]).appendArc([213.6763655,55.7172746],{"radius":2,"clockwise":false,"large":false}).appendPoint([197.0478563,52.1827759]).appendPoint([196.4241213,55.1172187]).appendArc([194.0520027,56.6576905],{"radius":2,"clockwise":false,"large":false}).appendPoint([180.3579363,53.7469269]).appendArc([178.8174645,51.3748083],{"radius":2,"clockwise":false,"large":false}).appendPoint([179.8570229,46.4840703]).appendPoint([163.2285137,42.9495716]).appendArc([161.6880419,40.577453],{"radius":2,"clockwise":false,"large":false}).appendPoint([145.0595326,37.0429542]).appendArc([143.5190608,34.6708356],{"radius":2,"clockwise":false,"large":false}).appendPoint([144.9744426,27.8238024]).appendPoint([147.2882407,16.9382386]).appendPoint([119.1920064,-6.6373011]).appendPoint([118.9796851,-6.4591424]).appendPoint([112.1568183,-62.0269334]).close().innerToCAG()
).extrude({ offset: [0, 0, 1.2] });
}


function switch_cutouts_extrude_1_2_outline_fn(){
    return new CSG.Path2D([[166.332539,27.8653074],[180.2222349,30.8176534]]).appendPoint([177.5609652,43.3379426]).appendPoint([163.6712693,40.3855966]).appendPoint([166.332539,27.8653074]).close().innerToCAG()
.union(
    new CSG.Path2D([[187.4122837,20.0778583],[201.3019796,23.0302043]]).appendPoint([198.6407099,35.5504935]).appendPoint([184.751014,32.5981475]).appendPoint([187.4122837,20.0778583]).close().innerToCAG()
).union(
    new CSG.Path2D([[183.4619616,38.6626627],[197.3516575,41.6150087]]).appendPoint([194.6903878,54.1352979]).appendPoint([180.8006919,51.1829519]).appendPoint([183.4619616,38.6626627]).close().innerToCAG()
).union(
    new CSG.Path2D([[54.2114557,12.232849],[68.1011516,9.280503]]).appendPoint([70.7624213,21.8007922]).appendPoint([56.8727254,24.7531382]).appendPoint([54.2114557,12.232849]).close().innerToCAG()
).union(
    new CSG.Path2D([[37.0820332,23.0302043],[50.9717291,20.0778583]]).appendPoint([53.6329988,32.5981475]).appendPoint([39.7433029,35.5504935]).appendPoint([37.0820332,23.0302043]).close().innerToCAG()
).union(
    new CSG.Path2D([[57.6327593,-29.3879953],[71.5224552,-32.3403413]]).appendPoint([74.1837249,-19.8200521]).appendPoint([60.294029,-16.8677061]).appendPoint([57.6327593,-29.3879953]).close().innerToCAG()
).union(
    new CSG.Path2D([[76.330759,24.911036],[90.2204549,21.95869]]).appendPoint([92.8817246,34.4789792]).appendPoint([78.9920287,37.4313252]).appendPoint([76.330759,24.911036]).close().innerToCAG()
).union(
    new CSG.Path2D([[68.4301147,-12.2585728],[82.3198106,-15.2109188]]).appendPoint([84.9810803,-2.6906296]).appendPoint([71.0913844,0.2617164]).appendPoint([68.4301147,-12.2585728]).close().innerToCAG()
).union(
    new CSG.Path2D([[58.1617779,30.8176534],[72.0514738,27.8653074]]).appendPoint([74.7127435,40.3855966]).appendPoint([60.8230476,43.3379426]).appendPoint([58.1617779,30.8176534]).close().innerToCAG()
).union(
    new CSG.Path2D([[21.4079925,40.6745928],[35.2976884,37.7222468]]).appendPoint([37.9589581,50.242536]).appendPoint([24.0692622,53.194882]).appendPoint([21.4079925,40.6745928]).close().innerToCAG()
).union(
    new CSG.Path2D([[17.4576704,22.0897884],[31.3473663,19.1374424]]).appendPoint([34.008636,31.6577316]).appendPoint([20.1189401,34.6100776]).appendPoint([17.4576704,22.0897884]).close().innerToCAG()
).union(
    new CSG.Path2D([[72.3804368,6.3262316],[86.2701327,3.3738856]]).appendPoint([88.9314024,15.8941748]).appendPoint([75.0417065,18.8465208]).appendPoint([72.3804368,6.3262316]).close().innerToCAG()
).union(
    new CSG.Path2D([[41.0323553,41.6150087],[54.9220512,38.6626627]]).appendPoint([57.5833209,51.1829519]).appendPoint([43.693625,54.1352979]).appendPoint([41.0323553,41.6150087]).close().innerToCAG()
).union(
    new CSG.Path2D([[33.131711,4.4453999],[47.0214069,1.4930539]]).appendPoint([49.6826766,14.0133431]).appendPoint([35.7929807,16.9656891]).appendPoint([33.131711,4.4453999]).close().innerToCAG()
).union(
    new CSG.Path2D([[13.5073482,3.504984],[27.3970441,0.552638]]).appendPoint([30.0583138,13.0729272]).appendPoint([16.1686179,16.0252732]).appendPoint([13.5073482,3.504984]).close().innerToCAG()
).union(
    new CSG.Path2D([[152.1138801,3.3738856],[166.003576,6.3262316]]).appendPoint([163.3423063,18.8465208]).appendPoint([149.4526104,15.8941748]).appendPoint([152.1138801,3.3738856]).close().innerToCAG()
).union(
    new CSG.Path2D([[156.0642022,-15.2109188],[169.9538981,-12.2585728]]).appendPoint([167.2926284,0.2617164]).appendPoint([153.4029325,-2.6906296]).appendPoint([156.0642022,-15.2109188]).close().innerToCAG()
).union(
    new CSG.Path2D([[170.2828612,9.280503],[184.1725571,12.232849]]).appendPoint([181.5112874,24.7531382]).appendPoint([167.6215915,21.8007922]).appendPoint([170.2828612,9.280503]).close().innerToCAG()
).union(
    new CSG.Path2D([[174.2331833,-9.3043014],[188.1228792,-6.3519554]]).appendPoint([185.4616095,6.1683338]).appendPoint([171.5719136,3.2159878]).appendPoint([174.2331833,-9.3043014]).close().innerToCAG()
).union(
    new CSG.Path2D([[191.3626059,1.4930539],[205.2523018,4.4453999]]).appendPoint([202.5910321,16.9656891]).appendPoint([188.7013362,14.0133431]).appendPoint([191.3626059,1.4930539]).close().innerToCAG()
).union(
    new CSG.Path2D([[210.9869687,0.552638],[224.8766646,3.504984]]).appendPoint([222.2153949,16.0252732]).appendPoint([208.325699,13.0729272]).appendPoint([210.9869687,0.552638]).close().innerToCAG()
).union(
    new CSG.Path2D([[166.8615576,-32.3403413],[180.7512535,-29.3879953]]).appendPoint([178.0899838,-16.8677061]).appendPoint([164.2002879,-19.8200521]).appendPoint([166.8615576,-32.3403413]).close().innerToCAG()
).union(
    new CSG.Path2D([[148.1635579,21.95869],[162.0532538,24.911036]]).appendPoint([159.3919841,37.4313252]).appendPoint([145.5022882,34.4789792]).appendPoint([148.1635579,21.95869]).close().innerToCAG()
).union(
    new CSG.Path2D([[203.0863244,37.7222468],[216.9760203,40.6745928]]).appendPoint([214.3147506,53.194882]).appendPoint([200.4250547,50.242536]).appendPoint([203.0863244,37.7222468]).close().innerToCAG()
).union(
    new CSG.Path2D([[207.0366465,19.1374424],[220.9263424,22.0897884]]).appendPoint([218.2650727,34.6100776]).appendPoint([204.3753768,31.6577316]).appendPoint([207.0366465,19.1374424]).close().innerToCAG()
).union(
    new CSG.Path2D([[50.2611336,-6.3519554],[64.1508295,-9.3043014]]).appendPoint([66.8120992,3.2159878]).appendPoint([52.9224033,6.1683338]).appendPoint([50.2611336,-6.3519554]).close().innerToCAG()
).union(
    new CSG.Path2D([[78.5627937,-36.3797601],[89.4406247,-45.5073442]]).appendPoint([97.6683061,-35.7019753]).appendPoint([86.7904751,-26.5743912]).appendPoint([78.5627937,-36.3797601]).close().innerToCAG()
).union(
    new CSG.Path2D([[148.9433881,-45.5073442],[159.8212191,-36.3797601]]).appendPoint([151.5935377,-26.5743912]).appendPoint([140.7157067,-35.7019753]).appendPoint([148.9433881,-45.5073442]).close().innerToCAG()
).union(
    new CSG.Path2D([[-3.1960064,32.2297307],[10.898149,30.499186]]).appendPoint([12.4580766,43.2037767]).appendPoint([-1.6360788,44.9343214]).appendPoint([-3.1960064,32.2297307]).close().innerToCAG()
).union(
    new CSG.Path2D([[229.8013814,11.6408091],[243.8955368,13.3713538]]).appendPoint([242.3356092,26.0759445]).appendPoint([228.2414538,24.3453998]).appendPoint([229.8013814,11.6408091]).close().innerToCAG()
).union(
    new CSG.Path2D([[232.1168989,-7.2175677],[246.2110543,-5.487023]]).appendPoint([244.6511267,7.2175677]).appendPoint([230.5569713,5.487023]).appendPoint([232.1168989,-7.2175677]).close().innerToCAG()
).union(
    new CSG.Path2D([[-5.511524,13.3713538],[8.5826314,11.6408091]]).appendPoint([10.142559,24.3453998]).appendPoint([-3.9515964,26.0759445]).appendPoint([-5.511524,13.3713538]).close().innerToCAG()
).union(
    new CSG.Path2D([[-7.8270415,-5.487023],[6.2671139,-7.2175677]]).appendPoint([7.8270415,5.487023]).appendPoint([-6.2671139,7.2175677]).appendPoint([-7.8270415,-5.487023]).close().innerToCAG()
).union(
    new CSG.Path2D([[227.4858638,30.499186],[241.5800192,32.2297307]]).appendPoint([240.0200916,44.9343214]).appendPoint([225.9259362,43.2037767]).appendPoint([227.4858638,30.499186]).close().innerToCAG()
).union(
    new CSG.Path2D([[138.4233819,-64.9052969],[143.7427955,-51.7392861]]).appendPoint([131.8748421,-46.9443217]).appendPoint([126.5554285,-60.1103325]).appendPoint([138.4233819,-64.9052969]).close().innerToCAG()
).union(
    new CSG.Path2D([[94.6412173,-51.7392861],[99.9606309,-64.9052969]]).appendPoint([111.8285843,-60.1103325]).appendPoint([106.5091707,-46.9443217]).appendPoint([94.6412173,-51.7392861]).close().innerToCAG()
).extrude({ offset: [0, 0, 1.2] });
}




                function switch_plate_case_fn() {
                    

                // creating part 0 of case switch_plate
                let switch_plate__part_0 = board_extrude_1_2_outline_fn();

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
                let switch_plate__part_1 = switch_cutouts_extrude_1_2_outline_fn();

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

        