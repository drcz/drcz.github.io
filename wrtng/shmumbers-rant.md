# You're not computing with numbers
#### (since no such thing exists)

These are some examples I've been showing to many people, up to the point where I started feeling like my grandma, telling same joke each Sunday. So I decided to write it down and only keep handing the link, which saves us all some time.

## Nothing more unreal than the real line
If you've studied any mathematics you might have already developed some justified worries about [the real line](https://en.wikipedia.org/wiki/Real_number). For example, people can't figure out its basic structure like which subsets are there, and the science trying to clean up this mess turned into [massive endeavor](https://en.wikipedia.org/wiki/Descriptive_set_theory), and apparently they do use [forcing](https://en.wikipedia.org/wiki/Forcing_(mathematics)) which should be a red light to any sane person.

Nevertheless, we're interested in digital computers and computer programs so who cares about [Vitali sets](https://en.wikipedia.org/wiki/Vitali_set) and other Borelian nonsense? The first order theory of (a field of) real numbers is decidable, so as long as we're doing computations, one number at a time, we're good. Right?

Well, it's not that great. For example:
```
$ python3
Python 3.10.4 (main, May 14 2022, 05:40:22) [GCC 11.3.0] on linux
Type "help", "copyright", "credits" or "license" for more information.
>>> 1.0 - 0.9 - 0.1
-2.7755575615628914e-17
```
Hmm. Probably that's why I didn't use Pandas or whatever is fancy now... In my times (grandma mode) we used R.
```
$ R

R version 4.0.4 (2021-02-15) -- "Lost Library Book"
Copyright (C) 2021 The R Foundation for Statistical Computing
Platform: x86_64-pc-linux-gnu (64-bit)

> 1.0 - 0.9 - 0.1
[1] -2.775558e-17
```
Oww... And it's like that almost everywhere, and of course it has to be. Any kid knows how [floating-point representation](https://en.wikipedia.org/wiki/Double-precision_floating-point_format) works, and any reasonable teenager had already figured you can't fit arbitrary [Cauchy sequence](https://en.wikipedia.org/wiki/Construction_of_the_real_numbers#Construction_from_Cauchy_sequences) into 64bits. Since if you could, that would mean there are at most `18 446 744 073 709 551 616` real numbers. So we're cutting some corners, but how could it harm anyone?

I'll tell you how it harmed me, or rather a simulation we were doing at the University.

We were experimenting with a simple 1-dimensional continuous discrete dynamical system `([0,1],φ)` where
```
       ⎧    3x, x∈[0,1/3]
φ(x) = ⎨ -3x+2, x∈(1/3,2/3]
       ⎩  3x-2, x∈(2/3,1]
```
In other words we were taking points ("real numbers") between `0` and `1` and checking out what happens when you apply φ multiple times, like this (in R):
```
phi <- function(x) {
         ifelse(x < 1/3, 3*x,
                ifelse(x <= 2/3, -3*x+2,
                       3*x-2))
}

trajectory <- function(f,x0,n) {
  t <- c()
  for(i in 0:n) {
    t <- append(t,x0)
    x0 <- f(x0)
  }
  t
}
```
for example `φ(0.7) = 0.1`, then `φ(φ(0.7)) = φ(0.1) = 0.3`, `φ(φ(φ(0.7))) = φ(0.3) = 0.9` etc. :
```
> phi(0.7)
[1] 0.1
> phi(0.1)
[1] 0.3
> phi(0.3)
[1] 0.9
> phi(0.9)
[1] 0.7
```
So far so good. From the above example it's obvious (and paper and pencil confirm that beyond any doubt) `7/10` is a point of period 4, meaning its trajectory will just oscillate through these four: `1/10`, `3/10`, `9/10`, `7/10`. Now, since there are hardly any numbers larger than `13` (maybe `23` and `42`) this is how we carelessly confirmed correctness of the above "implementation":
```
> trajectory(phi,0.7,13)
 [1] 0.7 0.1 0.3 0.9 0.7 0.1 0.3 0.9 0.7 0.1 0.3 0.9 0.7 0.1
```
Great. So what's the problem? Things got weird when we started plotting accumulated statistics from pulling thousands of points via the system... it took a while to realize the above program does not work as expected. Look:
```
> trajectory(phi,0.7,100)
  [1] 0.70000000 0.10000000 0.30000000 0.90000000 0.70000000 0.10000000
  [7] 0.30000000 0.90000000 0.70000000 0.10000000 0.30000000 0.90000000
 [13] 0.70000000 0.10000000 0.30000000 0.90000000 0.69999999 0.09999998
 [19] 0.29999995 0.89999986 0.69999959 0.09999876 0.29999628 0.89998885
 [25] 0.69996655 0.09989966 0.29969898 0.89909695 0.69729084 0.09187253
 [31] 0.27561759 0.82685278 0.48055833 0.55832502 0.32502495 0.97507485
 [37] 0.92522454 0.77567361 0.32702082 0.98106246 0.94318738 0.82956213
 [43] 0.48868640 0.53394080 0.39817759 0.80546724 0.41640173 0.75079482
 [49] 0.25238445 0.75715335 0.27146006 0.81438017 0.44314050 0.67057851
 [55] 0.01173554 0.03520662 0.10561985 0.31685954 0.95057862 0.85173587
 [61] 0.55520761 0.33437718 0.99686847 0.99060541 0.97181624 0.91544872
 [67] 0.74634617 0.23903850 0.71711550 0.15134650 0.45403950 0.63788151
 [73] 0.08635548 0.25906645 0.77719934 0.33159801 0.99479403 0.98438209
 [79] 0.95314628 0.85943885 0.57831655 0.26505034 0.79515101 0.38545303
 [85] 0.84364090 0.53092271 0.40723186 0.77830443 0.33491328 0.99526015
 [91] 0.98578046 0.95734138 0.87202413 0.61607240 0.15178279 0.45534837
 [97] 0.63395490 0.09813530 0.29440589 0.88321767 0.64965302
```
Turns out we have been fooled by R's truncated display of the "numbers" and after 15 steps the tiny fluctuation becomes visible... Analytically periodic point literally left its orbit, and the further you go, the more it's all over the place... In IEEE754's defense, this system is chaotic (hint: [Li-Yorke theorem](https://en.wikipedia.org/wiki/James_A._Yorke#Contributions) and look at the plot of 3-fold composition of φ, and forget the 3 fixpoints — clearly there are 23 points of period 3, which not only implies chaos but apparently also Chaos, _Heil Eris!_)

Eventually, in order to get correct data for our experiments, we switched from floating-point "real numbers" to bignum-based "rational numbers" which are one of the builtin numerical types in Scheme (also since Scheme's syntax is so clean, we could use Unicode φ, how cool is that?!)

```
(define (φ x)
  (cond ((< x 1/3) (* x 3))
        ((< x 2/3) (+ (* -3 x) 2))
        (else (- (* 3 x) 2))))
        
(define (trajectory φ x0 n)
  (if (> n 0)
      `(,x0 . ,(trajectory f (f x0) (- n 1)))
      '()))
```
Which has no problems and can be casted to doubles afterwards:
```
scheme@(guile-user)> (trajectory φ 7/10 100)
$1 = (7/10 1/10 3/10 9/10 7/10 1/10 3/10 9/10 7/10 1/10 3/10 9/10 7/10
      1/10 3/10 9/10 7/10 1/10 3/10 9/10 7/10 1/10 3/10 9/10 7/10 1/10
      3/10 9/10 7/10 1/10 3/10 9/10 7/10 1/10 3/10 9/10 7/10 1/10 3/10
      9/10 7/10 1/10 3/10 9/10 7/10 1/10 3/10 9/10 7/10 1/10 3/10 9/10
      7/10 1/10 3/10 9/10 7/10 1/10 3/10 9/10 7/10 1/10 3/10 9/10 7/10
      1/10 3/10 9/10 7/10 1/10 3/10 9/10 7/10 1/10 3/10 9/10 7/10 1/10
      3/10 9/10 7/10 1/10 3/10 9/10 7/10 1/10 3/10 9/10 7/10 1/10 3/10
      9/10 7/10 1/10 3/10 9/10 7/10 1/10 3/10 9/10)
scheme@(guile-user)> (map (lambda (x) (* 1.0 x))
                          (trajectory φ 7/10 100))
$2 = (0.7 0.1 0.3 0.9 0.7 0.1 0.3 0.9 0.7 0.1 0.3 0.9 0.7 0.1 0.3 0.9 0.7
      0.1 0.3 0.9 0.7 0.1 0.3 0.9 0.7 0.1 0.3 0.9 0.7 0.1 0.3 0.9 0.7 0.1
      0.3 0.9 0.7 0.1 0.3 0.9 0.7 0.1 0.3 0.9 0.7 0.1 0.3 0.9 0.7 0.1 0.3
      0.9 0.7 0.1 0.3 0.9 0.7 0.1 0.3 0.9 0.7 0.1 0.3 0.9 0.7 0.1 0.3 0.9
      0.7 0.1 0.3 0.9 0.7 0.1 0.3 0.9 0.7 0.1 0.3 0.9 0.7 0.1 0.3 0.9 0.7
      0.1 0.3 0.9 0.7 0.1 0.3 0.9 0.7 0.1 0.3 0.9 0.7 0.1 0.3 0.9)
```

These issues with floats and doubles were pretty obvious to our grandparents who wrote most of currently used numerical code in Fortran. Since then nobody knows how it works and we just have to preserve it.


## No integers, no naturals, no Dave
Now obviously bignum doesn't solve all our problems, but it does solve one, which is already easy to miss:

```
scala> 65536*65536
res0: Int = 0
```
Apparently 65536 is a divisor of 0. You might think it's obvious, but then it's not immediately obvious the following C procedure does NOT compute factorial function:
```
int factorial(int n) {
  int res = 1;
  while(n>0) { res *= n ; n--; }
  return res; 
}
```

But it takes no time to see it doesn't and maybe a moment to realize it can't.
```
void main() { int i; for(i=0; i<42; i++) printf("factorial(%d)=%d\n",i,factorial(i)); }
```
produces:
```
factorial(0)=1
factorial(1)=1
factorial(2)=2
factorial(3)=6
factorial(4)=24
factorial(5)=120
factorial(6)=720
factorial(7)=5040
factorial(8)=40320
factorial(9)=362880
factorial(10)=3628800
factorial(11)=39916800
factorial(12)=479001600
factorial(13)=1932053504
factorial(14)=1278945280
factorial(15)=2004310016
factorial(16)=2004189184
factorial(17)=-288522240
factorial(18)=-898433024
factorial(19)=109641728
factorial(20)=-2102132736
factorial(21)=-1195114496
factorial(22)=-522715136
factorial(23)=862453760
factorial(24)=-775946240
factorial(25)=2076180480
factorial(26)=-1853882368
factorial(27)=1484783616
factorial(28)=-1375731712
factorial(29)=-1241513984
factorial(30)=1409286144
factorial(31)=738197504
factorial(32)=-2147483648
factorial(33)=-2147483648
factorial(34)=0
factorial(35)=0
factorial(36)=0
factorial(37)=0
factorial(38)=0
factorial(39)=0
factorial(40)=0
factorial(41)=0
```
Sweet, isn't it? And not any better with `unsigned int`, while relying on bignum instead only pushes these problems a bit further. At first glance it's _a lot_ further, but still within a reach of a good old combinatorial explosion (go on, feed `trajectory` with `factorial` and some moderately large number and enjoy the flight).

This can get pretty dangerous, for example I do believe programmers in the aviation industry are nothing less than brilliant and careful, stick to the "best practices" and testing and all that. Yet, look at [this](https://www.theregister.com/2015/05/01/787_software_bug_can_shut_down_planes_generators/) (TL;DR Boeing 787 planes need to be "reset" every 200 days or so, _"because a software bug shuts down the plane's electricity generators every 248 days"_ and apparently said bug is related to hitting the limit of what `unsigned int` can represent).

Similar problems hold for practically any computable arithmetic function (unless it's not defined only on a small finite subset of natural numbers). We never compute them, we have some artifacts which clearly do something and seem to fit the definitions, but they're nothing like "the real thing" — they can't be because "the real thing" doesn't even exist. It's just a opinion, but a strong one. Even the very large finite things can't exist, but for this consult e.g. [wiki](https://en.wikipedia.org/wiki/Ultrafinitism). I recall there was a neat anecdote about Esenin-Volpin in some early chapters of _"Naming Infinity: A True Story of Religious Mysticism and Mathematical Creativity"_ by Loren Graham and Jean-Michel Kantor (Harvard University Press, 2009) but I had the book borrowed, so I can't reproduce it faithfully enough now, and I drifted away into digression, didn't I? My point is that despite the above `factorial` procedure/program lends itself (trivially) to proof by induction that it _does_ "capture the factorial function", quite obviously it _doesn't_ "capture the factorial function", since any physical storage is _nothing_ like the set of natural numbers... Inductive proofs about computer programs inside a physical computer are _never_ correct! There is only certain correspondence between initial segment of the induction/recursion and the program's behaviour (perhaps, maybe).

This makes formal methods in program verification a little less attractive than they seemed, doesn't it? You can _e.g._ establish semantic equivalence of two algorithms, implement them on a digital computer, and have two semantically different programs. I did. This happens. Sorry.


## Conclusions

In this way too long rant I tried to make three points:

+ Being pedantic about the language used (like `numerals` instead of `numbers`) can save your plane from requiring to be turned off and on again.

+ But even then you'll have to reset your hardware from time to time (think of a processor as a discrete dynamical system, we just lose track of its trajectory when it passes certain threshold). Neither TDD nor formal methods will save you. I don't mean one shouldn't utilise them — quite the contrary, testing is good and proofs are even better. But they are not magic powder which removes uncertainty. Accept failures and prepare plan B "just in case".

+ No such thing as numbers or arithmetic functions exist, but also nothing else exists, yet we can have lots of fun with all these things, and it's more important to have fun than ontological positions.


Although I really meant only this: **next time you ask me _"So, does it work now?"_ don't be puzzled I reply _"We may never know"_ — I do mean it!**

---

_Last rev. 2023/10/13_