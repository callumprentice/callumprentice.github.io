import Image, ImageDraw

flights = [
# include data from flight_one.js here
]

image = Image.open("earth.png")

draw = ImageDraw.Draw(image)

r = 1
for i in range(len(flights)):
    x = ((flights[i][1] + 180.0)/360.0)*4096
    y = 2048 - ((flights[i][0] + 90.0)/180.0)*2048
    draw.ellipse((x-r, y-r, x+r, y+r), fill=(255,255,0))

    x = ((flights[i][3] + 180.0)/360.0)*4096
    y = 2048 - ((flights[i][2] + 90.0)/180.0)*2048
    draw.ellipse((x-r, y-r, x+r, y+r), fill=(255,255,0))

#image.show()
image.save("/Users/callum/Desktop/earth_airports.png", "PNG")