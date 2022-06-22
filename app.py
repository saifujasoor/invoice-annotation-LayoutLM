from flask import Flask, request, render_template, redirect, url_for
import os
from numpy import True_
from werkzeug.utils import secure_filename
import glob
import cv2
import pytesseract
import pandas as pd
import numpy as np
app = Flask(__name__)
#import pyautogui


@app.route('/')
def index():
    path = 'static/uploads/'
    uploads = sorted(os.listdir(path), key=lambda x: os.path.getctime(
        path+x))        # Sorting as per image upload date and time
    #print(uploads)

    uploads = ['uploads/' + file for file in uploads]
    uploads.reverse()

    # Pass filenames to front end for display in 'uploads' variable
    return render_template('upload.html', uploads=uploads)


app.config['UPLOAD_FOLDER'] = 'static/uploads'             # Storage path


ALLOWED_EXTENSIONS = set(['png', 'jpg', 'jpeg', 'gif'])


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@app.route('/')
def home():
    return render_template('upload.html')


@app.route('/display')
def display():
    filename=request.args['filename']
    #print(filename)
    return render_template('display.html',filename=filename)


@app.route("/upload", methods=['POST'])
def mix():
    if request.method == 'POST':
        f = request.files['file']
        #print(f.filename)

        filename = secure_filename(f.filename)
        f.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
        #return redirect(url_for(".display",filename=filename)) 
        

        # Redirect to route '/' for displaying images on front end
            #return redirect("/display")


        def save_csv(uploadimgpath):
            
            img_cv = cv2.imread(uploadimgpath)
            data = pytesseract.image_to_data(img_cv)

            data.split('\n')[0].split('\t')
            dataList = list(map(lambda x: x.split('\t'),data.split('\n')))
            df = pd.DataFrame(dataList[1:],columns=dataList[0])
            df.dropna(inplace=True) # drop the missing in rows
            col_int = ['left','top','width','height','conf']
            df[col_int] = df[col_int].astype(int)
            df = df[['left','top','width','height',"conf","text"]]
            df["imageWidth"] = img_cv.shape[1]
            df["imageHeight"] = img_cv.shape[0]
            df["fileName"] = uploadimgpath.split("/")[-1]
            
        # Cleaning the df
        # Replace white spaces with nan
            df = df.replace(r'^\s+$', np.nan, regex=True)
        # droping nan values from the dataframe
            df.dropna(inplace=True)
        # Droping values where confidence is less then 5 percentile
            df =df[df.conf > np.quantile(df.conf.values,0.05)]
            csvFilename = uploadimgpath[:-4] + ".json"
            
            df.to_json(csvFilename, orient='index', indent=4, index='True')
        
            #csvFilename = uploadimgpath[:-4] + ".csv"
            #df.to_csv(csvFilename)
        list_of_files=glob.glob('./static/uploads/*.jpg')
        latest_file=max(list_of_files, key=os.path.getctime)
        save_csv(latest_file)

            # Redirect to route '/' for displaying images on front end
        return redirect(url_for(".display",filename=filename))   

@app.route('/save', methods=['POST'])
def post_javascript_data():
    #print(request)
    jsdata = request.form['canvas_data']
    list_of_files=glob.glob('./static/uploads/*.jpg')
    latest_file=max(list_of_files, key=os.path.getctime)
    print(latest_file)
    with open(f"{latest_file[:-4]}output.json", "w") as text_file:
        text_file.write(jsdata)
    #print(type(jsdata)) 

    return render_template('upload.html')  ## To be checked later

'''
@app.route("/upload", methods=['POST'])
def upload_file():
    if request.method == 'POST':
        f = request.files['file']
        print(f.filename)

        filename = secure_filename(f.filename)
        f.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))

        # Redirect to route '/' for displaying images on front end
    return redirect(url_for(".display",filename=filename))


@app.route("/csv/", methods=['POST'])
def mix():

    def save_csv(uploadimgpath):
        
        img_cv = cv2.imread(uploadimgpath)
        data = pytesseract.image_to_data(img_cv)
        data.split('\n')[0].split('\t')
        dataList = list(map(lambda x: x.split('\t'),data.split('\n')))
        df = pd.DataFrame(dataList[1:],columns=dataList[0])
        df.dropna(inplace=True) # drop the missing in rows
        col_int = ['left','top','width','height','conf']
        df[col_int] = df[col_int].astype(int)
        df = df[['left','top','width','height',"conf","text"]]
        df["imageWidth"] = img_cv.shape[1]
        df["imageHeight"] = img_cv.shape[0]
        df["fileName"] = uploadimgpath.split("/")[-1]
        
    # Cleaning the df
    # Replace white spaces with nan
        df = df.replace(r'^\s+$', np.nan, regex=True)
    # droping nan values from the dataframe
        df.dropna(inplace=True)
        
    # Droping values where confidence is less then 5 percentile
        df =df[df.conf > np.quantile(df.conf.values,0.05)]
    
        csvFilename = uploadimgpath[:-4] + ".json"
        df.to_json(csvFilename, orient='index', indent=4, index='True')
        #df.to_csv(csvFilename)
    list_of_files=glob.glob('/home/test/Desktop/invoice-annotation/static/uploads/*.jpg')
    latest_file=max(list_of_files, key=os.path.getctime)
    
    save_csv(latest_file)
    #return render_template('display.html')
    #return redirect("/display")
    return redirect(url_for(".display",filename=latest_file))
'''
if __name__ == "__main__":
    app.run(debug=True, use_reloader=True)
