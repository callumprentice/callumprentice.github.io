#!/usr/bin/env python

"""\
@file create_mission_lookup.py
@brief Create the tablethat is loaded into the app and provides fast
       reverse lookup for lat/lng -> photos at that point
"""
import math
import sys
import json
import pprint

filepath = '/Users/callum/work/callum/web/web-sandbox/processing/iss_photo_viewer_2/iss.txt'

def encodeLatLng(lat, lng):
    return hex(lat)[2:]+hex(lng)[2:]

def encodePhotoId(photo_id):
    # xx-xxx-xxxxxx

    parts = photo_id.split('-')

    mission_num = parts[0]

    roll_number = parts[1]

    try:
        photo_number = hex(int(parts[2]))[2:]

        return mission_num + roll_number + '.' + photo_number



    except:
        return ""
        pass

print('Starting to read file from {}').format(filepath)
with open(filepath) as f:
    data = f.readlines()

    table = dict()

    minp = 1000000
    maxp = 0

    foo = None
    previous = next_ = None
    l = len(data)
    for index, line in enumerate(data):

        prev_pos = - 1;
        if index + prev_pos < 0:
            prev_pos = 0;

        next_pos = 1;
        if index + next_pos >= l - 1:
            next_pos = 0;

        tokens = line.rstrip().split(',')
        photo_id = tokens[0][4:]
        lat = int(float(tokens[1]))+90
        lng = int(float(tokens[2]))+180

        # tokens_prev = data[index + prev_pos].rstrip().split(',')
        # photo_id_prev = tokens_prev[0][4:]

        # tokens_next = data[index + next_pos].rstrip().split(',')
        # photo_id_next = tokens_next[0][4:]

        curr = encodePhotoId(photo_id) + "_" + encodeLatLng(lat, lng)
        print curr + "|" + curr + "|" + curr







        #print photo_id_prev, photo_id, photo_id_next

# 14-E-18962,Lat,Lng,14-E-18963,Lat,Lng,14-E-18964,Lat,Lng


    # for n, line in enumerate(data, 1):

    #     tokens = line.rstrip().split(',')

    #     photo_id = tokens[0][4:]
    #     lat = int(float(tokens[1]))+90
    #     lng = int(float(tokens[2]))+180






        # parts = photo_id.split('-')

        # if parts[1] != 'E':
        #     print parts[1]


        # p2 = '0'
        # try:
        #     p2i = int(parts[2])
        #     p2 = hex(p2i)[2:]

        #     photo_id_new = parts[0].zfill(2) + parts[1] +"_" + p2
        #     print("{}_{}{}").format(photo_id_new, hex(lat)[2:], hex(lng)[2:])

        # except:
        #     # print parts[2]
        #     pass



        #     lat, lng, photoid, next_entry





#         index = "{}_{}".format(lat, lng)

#         for s in data:
#             if photo_id in s:
#                 print data.index(s)

# 01,


#         # next_pos = data.index(next_photo)

#         if index in table:
#             current = table[index]
#             if current.find(photo_id) == -1:
#                 current = current + ","
#                 current = current + photo_id
#                 table[index] = current
#         else:
#             table[index] = photo_id

#     print json.dumps(table)
