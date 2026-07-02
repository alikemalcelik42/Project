import tkinter as tk

def buton_tikla(deger):
    mevcut = giris.get()
    giris.delete(0, tk.END)
    giris.insert(0, mevcut + str(deger))

def temizle():
    giris.delete(0, tk.END)

def sil():
    mevcut = giris.get()
    giris.delete(0, tk.END)
    giris.insert(0, mevcut[:-1])

def hesapla():
    try:
        sonuc = eval(giris.get())
        giris.delete(0, tk.END)
        giris.insert(0, str(sonuc))
    except ZeroDivisionError:
        giris.delete(0, tk.END)
        giris.insert(0, "Hata: /0")
    except Exception:
        giris.delete(0, tk.END)
        giris.insert(0, "Hata")

pencere = tk.Tk()
pencere.title("Hesap Makinesi")
pencere.resizable(False, False)
pencere.configure(bg="#1e1e1e")

giris = tk.Entry(
    pencere, font=("Segoe UI", 24), borderwidth=0,
    justify="right", bg="#2d2d2d", fg="white",
    insertbackground="white"
)
giris.grid(row=0, column=0, columnspan=4, sticky="nsew", ipady=20, padx=8, pady=8)

butonlar = [
    ("C", 1, 0, "#c0392b"), ("←", 1, 1, "#555"), ("%", 1, 2, "#555"), ("/", 1, 3, "#e67e22"),
    ("7", 2, 0, "#333"), ("8", 2, 1, "#333"), ("9", 2, 2, "#333"), ("*", 2, 3, "#e67e22"),
    ("4", 3, 0, "#333"), ("5", 3, 1, "#333"), ("6", 3, 2, "#333"), ("-", 3, 3, "#e67e22"),
    ("1", 4, 0, "#333"), ("2", 4, 1, "#333"), ("3", 4, 2, "#333"), ("+", 4, 3, "#e67e22"),
    ("0", 5, 0, "#333"), (".", 5, 1, "#333"), ("=", 5, 2, "#27ae60"), ("", 5, 3, None),
]

def komut(metin):
    if metin == "C":
        temizle()
    elif metin == "←":
        sil()
    elif metin == "=":
        hesapla()
    elif metin == "%":
        buton_tikla("/100")
    else:
        buton_tikla(metin)

for (metin, satir, sutun, renk) in butonlar:
    if metin == "":
        continue
    b = tk.Button(
        pencere, text=metin, font=("Segoe UI", 16),
        bg=renk, fg="white", borderwidth=0,
        activebackground="#666", activeforeground="white",
        command=lambda m=metin: komut(m)
    )
    b.grid(row=satir, column=sutun, sticky="nsew", padx=4, pady=4, ipady=12)

for i in range(6):
    pencere.grid_rowconfigure(i, weight=1)
for i in range(4):
    pencere.grid_columnconfigure(i, weight=1)

pencere.mainloop()