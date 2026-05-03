function board_extrude_1_5_outline_fn(){
    return new CSG.Path2D([[142.2095776,-147.1670755],[181.7418316,-144.1946304]]).appendArc([182.0417466,-144.1946304],{"radius":2,"clockwise":true,"large":false}).appendPoint([221.5739992,-147.1670755]).appendArc([223.718327,-145.3226626],{"radius":2,"clockwise":false,"large":false}).appendPoint([224.8430078,-130.3648856]).appendArc([222.9985949,-128.2205578],{"radius":2,"clockwise":false,"large":false}).appendPoint([193.7693406,-126.0227993]).appendPoint([193.6357939,-124.2466853]).appendPoint([182.0417464,-125.1184462]).appendArc([181.7418316,-125.1184462],{"radius":2,"clockwise":true,"large":false}).appendPoint([170.1477829,-124.2466853]).appendPoint([170.0142362,-126.0227991]).appendPoint([140.7849819,-128.2205578]).appendArc([138.940569,-130.3648855],{"radius":2,"clockwise":false,"large":false}).appendPoint([140.0652498,-145.3226626]).appendArc([142.2095775,-147.1670755],{"radius":2,"clockwise":false,"large":false}).close().innerToCAG()
.union(
    new CSG.Path2D([[91.1205523,-108.2252909],[105.9399504,-110.5459466]]).appendArc([108.2252908,-108.8794477],{"radius":2,"clockwise":false,"large":false}).appendPoint([108.8441324,-104.9276081]).appendArc([111.1294729,-103.2611092],{"radius":2,"clockwise":true,"large":false}).appendPoint([117.0572321,-104.1893715]).appendArc([119.3425726,-102.5228726],{"radius":2,"clockwise":false,"large":false}).appendPoint([120.2715644,-96.5904549]).appendPoint([128.0637533,-97.8944202]).appendArc([130.3664197,-96.2519442],{"radius":2,"clockwise":false,"large":false}).appendPoint([130.8044108,-93.6346126]).appendArc([133.7190058,-92.2004541],{"radius":2,"clockwise":true,"large":false}).appendPoint([134.8329777,-92.7952597]).appendArc([135.8796299,-94.3469852],{"radius":2,"clockwise":true,"large":false}).appendPoint([136.6853662,-101.8864494]).appendArc([138.8865703,-103.6625971],{"radius":2,"clockwise":false,"large":false}).appendPoint([144.8525978,-103.0250126]).appendArc([147.0538019,-104.8011603],{"radius":2,"clockwise":true,"large":false}).appendPoint([147.4788582,-108.7785122]).appendArc([149.6800622,-110.5546599],{"radius":2,"clockwise":false,"large":false}).appendPoint([155.8757248,-109.8925346]).appendPoint([155.953012,-110.2500021]).appendPoint([159.1937604,-109.5493275]).appendArc([159.4038818,-109.5154834],{"radius":2,"clockwise":true,"large":false}).appendPoint([164.0882528,-109.0148685]).appendArc([166.2556128,-110.5808948],{"radius":2,"clockwise":true,"large":false}).appendPoint([166.9951197,-114.0012495]).appendArc([169.3726011,-115.5334317],{"radius":2,"clockwise":false,"large":false}).appendPoint([181.4691388,-112.9180676]).appendArc([182.314438,-112.9180676],{"radius":2,"clockwise":true,"large":false}).appendPoint([194.4109757,-115.5334317]).appendArc([196.7884571,-114.0012495],{"radius":2,"clockwise":false,"large":false}).appendPoint([197.527964,-110.5808948]).appendArc([199.695324,-109.0148685],{"radius":2,"clockwise":true,"large":false}).appendPoint([204.379695,-109.5154834]).appendArc([204.5898164,-109.5493275],{"radius":2,"clockwise":true,"large":false}).appendPoint([207.8305648,-110.2500021]).appendPoint([207.907852,-109.8925346]).appendPoint([214.1035145,-110.5546599]).appendArc([216.3047187,-108.7785122],{"radius":2,"clockwise":false,"large":false}).appendPoint([216.7297749,-104.8011603]).appendArc([218.930979,-103.0250126],{"radius":2,"clockwise":true,"large":false}).appendPoint([224.8970065,-103.662597]).appendArc([227.0982106,-101.8864494],{"radius":2,"clockwise":false,"large":false}).appendPoint([227.9039469,-94.3469852]).appendArc([228.950599,-92.7952597],{"radius":2,"clockwise":true,"large":false}).appendPoint([230.0645711,-92.200454]).appendArc([232.979166,-93.6346126],{"radius":2,"clockwise":true,"large":false}).appendPoint([233.4171571,-96.2519442]).appendArc([235.7198235,-97.8944202],{"radius":2,"clockwise":false,"large":false}).appendPoint([243.5120124,-96.5904549]).appendPoint([244.4410042,-102.5228726]).appendArc([246.7263447,-104.1893715],{"radius":2,"clockwise":false,"large":false}).appendPoint([252.6541039,-103.2611092]).appendArc([254.9394444,-104.9276081],{"radius":2,"clockwise":true,"large":false}).appendPoint([255.5582859,-108.8794477]).appendArc([257.8436265,-110.5459466],{"radius":2,"clockwise":false,"large":false}).appendPoint([272.6630245,-108.2252909]).appendArc([274.3295234,-105.9399504],{"radius":2,"clockwise":false,"large":false}).appendPoint([266.4392937,-55.5539971]).appendArc([264.1539532,-53.8874982],{"radius":2,"clockwise":false,"large":false}).appendPoint([255.9461157,-55.1728112]).appendPoint([254.9223925,-49.0552828]).appendArc([252.6197261,-47.4128068],{"radius":2,"clockwise":false,"large":false}).appendPoint([246.7020125,-48.4030924]).appendArc([244.3993461,-46.7606164],{"radius":2,"clockwise":true,"large":false}).appendPoint([243.7391557,-42.815474]).appendArc([241.4364893,-41.172998],{"radius":2,"clockwise":false,"large":false}).appendPoint([226.6422052,-43.6487121]).appendArc([224.9997292,-45.9513785],{"radius":2,"clockwise":false,"large":false}).appendPoint([225.4158001,-48.4377198]).appendPoint([219.6665866,-37.6703998]).appendArc([216.960309,-36.8481699],{"radius":2,"clockwise":false,"large":false}).appendPoint([194.9071374,-48.6234669]).appendArc([194.0849075,-51.3297444],{"radius":2,"clockwise":false,"large":false}).appendPoint([195.968955,-54.8582519]).appendArc([195.1467251,-57.5645293],{"radius":2,"clockwise":true,"large":false}).appendPoint([193.318417,-58.5407549]).appendArc([191.9537437,-58.731333],{"radius":2,"clockwise":true,"large":false}).appendPoint([191.3726011,-58.6056855]).appendArc([188.9951197,-60.1378677],{"radius":2,"clockwise":false,"large":false}).appendPoint([188.8212569,-60.9420148]).appendPoint([188.0897101,-61.3326244]).appendPoint([188.5503012,-62.1952348]).appendPoint([181.8917884,-92.9920765]).appendPoint([175.2332756,-62.1952348]).appendPoint([175.6938667,-61.3326244]).appendPoint([174.9623199,-60.9420148]).appendPoint([174.7884571,-60.1378677]).appendArc([172.4109757,-58.6056855],{"radius":2,"clockwise":false,"large":false}).appendPoint([171.1125313,-58.8864191]).appendPoint([168.6368518,-57.5645293]).appendArc([167.8146218,-54.8582518],{"radius":2,"clockwise":true,"large":false}).appendPoint([169.6986693,-51.3297443]).appendArc([168.8764394,-48.6234669],{"radius":2,"clockwise":false,"large":false}).appendPoint([146.8232677,-36.8481699]).appendArc([144.1169903,-37.6703998],{"radius":2,"clockwise":false,"large":false}).appendPoint([138.3677767,-48.4377198]).appendPoint([138.7838476,-45.9513785]).appendArc([137.1413716,-43.6487121],{"radius":2,"clockwise":false,"large":false}).appendPoint([122.3470875,-41.172998]).appendArc([120.0444211,-42.815474],{"radius":2,"clockwise":false,"large":false}).appendPoint([119.3842307,-46.7606164]).appendArc([117.0815643,-48.4030924],{"radius":2,"clockwise":true,"large":false}).appendPoint([111.1638507,-47.4128068]).appendArc([108.8611843,-49.0552828],{"radius":2,"clockwise":false,"large":false}).appendPoint([107.8374611,-55.1728112]).appendPoint([99.6296236,-53.8874982]).appendArc([97.3442831,-55.5539971],{"radius":2,"clockwise":false,"large":false}).appendPoint([89.4540534,-105.9399504]).appendArc([91.1205523,-108.2252909],{"radius":2,"clockwise":false,"large":false}).close().innerToCAG()
).extrude({ offset: [0, 0, 1.5] });
}


function switch_cutouts_extrude_1_5_outline_fn(){
    return new CSG.Path2D([[258.0341554,-107.8844247],[271.6680015,-105.7494214]]).appendPoint([269.5329982,-92.1155753]).appendPoint([255.8991521,-94.2505786]).appendPoint([258.0341554,-107.8844247]).close().innerToCAG()
.union(
    new CSG.Path2D([[97.6851493,-70.1828662],[111.3189954,-72.3178695]]).appendPoint([113.4539987,-58.6840234]).appendPoint([99.8201526,-56.5490201]).appendPoint([97.6851493,-70.1828662]).close().innerToCAG()
).union(
    new CSG.Path2D([[92.1155753,-105.7494214],[105.7494214,-107.8844247]]).appendPoint([107.8844247,-94.2505786]).appendPoint([94.2505786,-92.1155753]).appendPoint([92.1155753,-105.7494214]).close().innerToCAG()
).union(
    new CSG.Path2D([[94.9003623,-87.9661438],[108.5342084,-90.1011471]]).appendPoint([110.6692117,-76.467301]).appendPoint([97.0353656,-74.3322977]).appendPoint([94.9003623,-87.9661438]).close().innerToCAG()
).union(
    new CSG.Path2D([[252.4645814,-72.3178695],[266.0984275,-70.1828662]]).appendPoint([263.9634242,-56.5490201]).appendPoint([250.3295781,-58.6840234]).appendPoint([252.4645814,-72.3178695]).close().innerToCAG()
).union(
    new CSG.Path2D([[255.2493684,-90.1011471],[268.8832145,-87.9661438]]).appendPoint([266.7482112,-74.3322977]).appendPoint([253.1143651,-76.467301]).appendPoint([255.2493684,-90.1011471]).close().innerToCAG()
).union(
    new CSG.Path2D([[207.409478,-143.4947004],[221.1706328,-144.5294068]]).appendPoint([222.2053392,-130.768252]).appendPoint([208.4441844,-129.7335456]).appendPoint([207.409478,-143.4947004]).close().innerToCAG()
).union(
    new CSG.Path2D([[142.612944,-144.5294068],[156.3740988,-143.4947004]]).appendPoint([155.3393924,-129.7335456]).appendPoint([141.5782376,-130.768252]).appendPoint([142.612944,-144.5294068]).close().innerToCAG()
).union(
    new CSG.Path2D([[200.0613348,-106.4391786],[213.7831984,-107.9056228]]).appendPoint([215.2496426,-94.1837592]).appendPoint([201.527779,-92.717315]).appendPoint([200.0613348,-106.4391786]).close().innerToCAG()
).union(
    new CSG.Path2D([[150.0003784,-107.9056228],[163.722242,-106.4391786]]).appendPoint([162.2557978,-92.717315]).appendPoint([148.5339342,-94.1837592]).appendPoint([150.0003784,-107.9056228]).close().innerToCAG()
).union(
    new CSG.Path2D([[229.9407573,-59.7247674],[243.5514986,-57.4471105]]).appendPoint([241.2738417,-43.8363692]).appendPoint([227.6631004,-46.1140261]).appendPoint([229.9407573,-59.7247674]).close().innerToCAG()
).union(
    new CSG.Path2D([[232.9116142,-77.4779082],[246.5223555,-75.2002513]]).appendPoint([244.2446986,-61.58951]).appendPoint([230.6339573,-63.8671669]).appendPoint([232.9116142,-77.4779082]).close().innerToCAG()
).union(
    new CSG.Path2D([[235.8824711,-95.231049],[249.4932124,-92.9533921]]).appendPoint([247.2155555,-79.3426508]).appendPoint([233.6048142,-81.6203077]).appendPoint([235.8824711,-95.231049]).close().innerToCAG()
).union(
    new CSG.Path2D([[114.2903644,-92.9533921],[127.9011057,-95.231049]]).appendPoint([130.1787626,-81.6203077]).appendPoint([116.5680213,-79.3426508]).appendPoint([114.2903644,-92.9533921]).close().innerToCAG()
).union(
    new CSG.Path2D([[120.2320782,-57.4471105],[133.8428195,-59.7247674]]).appendPoint([136.1204764,-46.1140261]).appendPoint([122.5097351,-43.8363692]).appendPoint([120.2320782,-57.4471105]).close().innerToCAG()
).union(
    new CSG.Path2D([[117.2612213,-75.2002513],[130.8719626,-77.4779082]]).appendPoint([133.1496195,-63.8671669]).appendPoint([119.5388782,-61.58951]).appendPoint([117.2612213,-75.2002513]).close().innerToCAG()
).union(
    new CSG.Path2D([[184.6894776,-92.3555872],[198.177817,-95.2718694]]).appendPoint([201.0940992,-81.78353]).appendPoint([187.6057598,-78.8672478]).appendPoint([184.6894776,-92.3555872]).close().innerToCAG()
).union(
    new CSG.Path2D([[165.6057598,-95.2718694],[179.0940992,-92.3555872]]).appendPoint([176.177817,-78.8672478]).appendPoint([162.6894776,-81.78353]).appendPoint([165.6057598,-95.2718694]).close().innerToCAG()
).union(
    new CSG.Path2D([[169.4096061,-112.8653555],[181.8917884,-110.1666122]]).appendPoint([194.3739707,-112.8653555]).appendPoint([197.2902529,-99.3770161]).appendPoint([183.8019135,-96.4607339]).appendPoint([181.8917884,-105.2954124]).appendPoint([179.9816633,-96.4607339]).appendPoint([166.4933239,-99.3770161]).appendPoint([169.4096061,-112.8653555]).close().innerToCAG()
).union(
    new CSG.Path2D([[160.5622764,-143.1797898],[174.3234312,-142.1450834]]).appendPoint([174.2373678,-141.0004769]).appendPoint([178.4731712,-141.3189685]).appendPoint([178.5116088,-141.8301726]).appendPoint([181.8917884,-141.5760156]).appendPoint([185.271968,-141.8301726]).appendPoint([185.3104056,-141.3189685]).appendPoint([189.546209,-141.0004769]).appendPoint([189.4601456,-142.1450834]).appendPoint([203.2213004,-143.1797898]).appendPoint([204.2560068,-129.418635]).appendPoint([191.3443381,-128.4478018]).appendPoint([191.2380572,-127.0343114]).appendPoint([181.8917884,-127.7370609]).appendPoint([172.5455196,-127.0343114]).appendPoint([172.4392387,-128.4478018]).appendPoint([159.52757,-129.418635]).appendPoint([160.5622764,-143.1797898]).close().innerToCAG()
).union(
    new CSG.Path2D([[220.1174362,-94.5643076],[232.290787,-88.0643436]]).appendPoint([225.790823,-75.8909928]).appendPoint([216.6849697,-80.7530657]).appendPoint([217.1623959,-76.2856762]).appendPoint([216.3060669,-76.194161]).appendPoint([223.8125731,-72.18606]).appendPoint([218.6365,-62.4921366]).appendPoint([219.0751492,-58.3875932]).appendPoint([212.7126509,-57.7076383]).appendPoint([215.3343592,-56.3077764]).appendPoint([208.8343952,-44.1344256]).appendPoint([196.6610444,-50.6343896]).appendPoint([203.1610084,-62.8077404]).appendPoint([204.818788,-61.9225685]).appendPoint([204.5837252,-64.1221071]).appendPoint([191.4096061,-61.2737617]).appendPoint([188.4933239,-74.7621011]).appendPoint([201.9816633,-77.6783833]).appendPoint([204.2622445,-67.1302775]).appendPoint([203.8868414,-70.6430126]).appendPoint([207.5539073,-71.0349089]).appendPoint([209.945754,-75.5144397]).appendPoint([203.4405323,-74.819232]).appendPoint([201.9740881,-88.5410956]).appendPoint([215.6959517,-90.0075398]).appendPoint([216.0275558,-86.9046423]).appendPoint([220.1174362,-94.5643076]).close().innerToCAG()
).union(
    new CSG.Path2D([[131.4927898,-88.0643436],[143.6661406,-94.5643076]]).appendPoint([147.756021,-86.9046423]).appendPoint([148.0876251,-90.0075398]).appendPoint([161.8094887,-88.5410956]).appendPoint([160.3430445,-74.819232]).appendPoint([153.8378228,-75.5144397]).appendPoint([156.2296695,-71.0349089]).appendPoint([159.8967354,-70.6430126]).appendPoint([159.5213323,-67.1302775]).appendPoint([161.8019135,-77.6783833]).appendPoint([175.2902529,-74.7621011]).appendPoint([172.3739707,-61.2737617]).appendPoint([159.1998516,-64.1221071]).appendPoint([158.9647888,-61.9225685]).appendPoint([160.6225684,-62.8077404]).appendPoint([167.1225324,-50.6343896]).appendPoint([154.9491816,-44.1344256]).appendPoint([148.4492176,-56.3077764]).appendPoint([151.0709259,-57.7076383]).appendPoint([144.7084276,-58.3875932]).appendPoint([145.1470768,-62.4921366]).appendPoint([139.9710037,-72.18606]).appendPoint([147.4775099,-76.194161]).appendPoint([146.6211809,-76.2856762]).appendPoint([147.0986071,-80.7530657]).appendPoint([137.9927538,-75.8909928]).appendPoint([131.4927898,-88.0643436]).close().innerToCAG()
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

        