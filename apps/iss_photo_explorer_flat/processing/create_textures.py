#!/usr/bin/env python

"""\
@file create_textures.py
@brief Process the earth and tracks textures for ISS Photo Explorer 2
"""
from PIL import Image, ImageDraw, ImageFont, ImageColor, ImageEnhance
import locale

def lat_lng_to_x_y(lat, lng, img_width, img_height):
    x = (img_width / 2) + lng * (img_width / (2 * 180.0))
    y = img_height - ((img_height / 2) + lat * (img_height / (2 * 90.0)))
    return (x, y)

def plot_city(lat, lng, name, font, img_width, img_height):
    city_point_radius = 10
    xy = lat_lng_to_x_y(lat, lng, img_width, img_height)
    draw.ellipse(
        (
            xy[0] - city_point_radius,
            xy[1] - city_point_radius,
            xy[0] + city_point_radius,
            xy[1] + city_point_radius,
        ),
        fill=(255, 0, 0),
        outline=(0, 0, 0),
    )
    caption = "%s\n(%f,%f)" % (name, lat, lng)
    draw.text(xy, caption, fill="black", font=font, align="left")

def plot_tracks(draw, img_width, img_height):
    filepath = "../../processing//iss_photo_viewer_2/iss.txt"

    cnt = 0

    pixels = [0] * img_width * img_height

    with open(filepath) as fp:
        for cnt, line in enumerate(fp):
            line = line.rstrip()
            tokens = line.split(",")

            lat = float(tokens[1])
            lng = float(tokens[2])

            x = (img_width / 2) + lng * (img_width / (2 * 180.0))
            y = img_height - ((img_height / 2) + lat * (img_height / (2 * 90.0)))

            x = int(x)
            y = int(y)

            index = int(y * img_width + x);
            pixels[index] = 1
            # mission = float(tokens[0][4:6])
            # hue = (mission / 63) * 360
            # color = "hsl({}, 100%, 25%)".format(hue)
            # draw.point([x, y], fill=(255,255,0,))

            cnt = cnt + 1

    for y in range(img_height):
        for x in range(img_width):
            index = int(y * img_width + x)
            if index == 1:
                # mission = float(tokens[0][4:6])
                # hue = (mission / 63) * 360
                # color = "hsl({}, 100%, 25%)".format(hue)
                draw.point([x, y], fill=(255,255,0,192))

    xy = (16, img_height - 64)
    locale.setlocale(locale.LC_ALL, '')

    #cnt = 3469299
    font = ImageFont.truetype("/Library/Fonts/Tahoma.ttf", 25)
    caption = "{:n} images - Missions 1 (2000) to 63 (2020)".format(cnt)
    draw.text(xy, caption, fill="red", font=font, align="left")


# 3,469,299 photos

def plot_helpers(draw, img_width, img_height, draw_debug):
    if draw_debug:
        font = ImageFont.truetype("/Library/Fonts/Tahoma.ttf", 50)

        # equator
        draw.line((0, img_height / 2, img_width, img_height / 2), fill="yellow")

        # prime meridian
        draw.line((img_width / 2, 0, img_width / 2, img_height), fill="yellow")

        # lowest/highest latitude ISS
        xy = lat_lng_to_x_y(51.6, 0, img_width, img_height)
        draw.line((0, xy[1], img_width, xy[1]), fill="green")
        xy = lat_lng_to_x_y(-51.6, 0, img_width, img_height)
        draw.line((0, xy[1], img_width, xy[1]), fill="green")

        # positive latitude, positive longitude
        plot_city(6.927079, 79.861244, "Columbo", font, img_width, img_height)
        plot_city(59.334591, 18.063240, "Stockholm", font, img_width, img_height)
        plot_city(22.302711, 114.177216, "Hong Kong", font, img_width, img_height)

        # positive latitude, negative longitude
        plot_city(37.773972, -122.431297, "San Francisco", font, img_width, img_height)
        plot_city(40.730610, -73.935242, "New York", font, img_width, img_height)
        plot_city(21.804132, -72.305832, "Providenciales", font, img_width, img_height)

        # negative latitude, positive longitude
        plot_city(-33.865143, 151.209900, "Sydney", font, img_width, img_height)
        plot_city(-25.731340, 28.218370, "Pretoria", font, img_width, img_height)
        plot_city(-6.200000, 106.816666, "Jakarta", font, img_width, img_height)

        # negative latitude, negative longitude
        plot_city(-34.603722, -58.381592, "Buenos Aires", font, img_width, img_height)
        plot_city(-15.77972, -47.92972, "Brasila", font, img_width, img_height)
        plot_city(-0.180653, -78.467834, "Quito", font, img_width, img_height)

bkg_img = Image.open("ground.jpg")
img_base = Image.new("RGBA", (bkg_img.size[0], bkg_img.size[1]), "white")
img_base.paste(bkg_img)
draw = ImageDraw.Draw(img_base, "RGBA")
plot_tracks(draw, bkg_img.size[0], bkg_img.size[1])
# plot_helpers(draw, bkg_img.size[0], bkg_img.size[1], True)
img_base = img_base.convert("RGB")
img_base.save("earth.jpg", "JPEG")
