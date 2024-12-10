import numpy as np # linear algebra
import pandas as pd # data processing, CSV file I/O (e.g. pd.read_csv)
import plotly.graph_objects as go
import plotly.express as px
import warnings
import os
import matplotlib.pyplot as plt
from d3blocks import D3Blocks
import datetime
import copy
from pylab import mpl
mpl.rcParams['font.sans-serif'] = ['SimHei']
warnings.filterwarnings("ignore")



if __name__ == "__main__":
    df = pd.read_csv("12.4-utf-8.csv", encoding="utf-8")
    # df_cleaned = df.dropna(how='any')  # 清掉存在nan数据的行
    df["初版时间"] = pd.to_datetime(df["初版时间"])

    fig, axs = plt.subplots(2, 2, sharey=True, figsize=(10.24, 7.68))    #1024*768像素
    fig.subplots_adjust(left=0.05, right=0.95, top=0.95, bottom=0.05,wspace=0.1, hspace=0.28)

    axs[0, 0].hist(df["差距天数"])
    axs[0, 0].set_title('琼瑶作品完稿到初版的时间差分布')
    axs[0, 0].set_xlabel('时间差（天）')
    axs[0, 0].set_ylabel('作品数量')
    axs[0, 0].legend()

    df1 = df[df["初版时间"]<=datetime.datetime(1979,5,9)]
    axs[0, 1].hist(df1["差距天数"])
    axs[0, 1].set_title('与平鑫涛结婚前琼瑶作品完稿到初版的时间差分布')
    axs[0, 1].set_xlabel('时间差（天）')
    axs[0, 1].set_ylabel('作品数量')
    axs[0, 1].legend()

    df2 = df[df["初版时间"] > datetime.datetime(1979, 5, 9)]
    df2 = df2[df2["初版时间"] <= datetime.datetime(1988, 1, 1)]
    axs[1, 0].hist(df2["差距天数"])
    axs[1, 0].set_title('与平鑫涛结婚后第一次回大陆前琼瑶作品完稿到初版的时间差分布')
    axs[1, 0].set_xlabel('时间差（天）')
    axs[1, 0].set_ylabel('作品数量')
    axs[1, 0].legend()

    df3 = df[df["初版时间"] > datetime.datetime(1988, 1, 1)]
    axs[1, 1].hist(df3["差距天数"])
    axs[1, 1].set_title('第一次回大陆后琼瑶作品完稿到初版的时间差分布')
    axs[1, 1].set_xlabel('时间差（天）')
    axs[1, 1].set_ylabel('作品数量')
    axs[1, 1].legend()

    plt.savefig('pic2.jpg',dpi=600)