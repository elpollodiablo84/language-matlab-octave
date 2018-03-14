%% Transpose
A = B';
A = {B, (C + D)'}';
A = [B, C']';

%% Strings
fprintf(fid, "test1 + ""%s + ''test%.5f", "test2", 3e-2};
cmd = sprintf('test1 + ""%s + ''test%.5f', 'test2', 3e-2};

%% Function
function out = fun(in)
    persistent a, index

    in = in.^a;
    index = index + 1;
    a = a*3;

    out = in(index);
end

%% 
C = 1; % <-- This line shouldn't be a comment if you put a space after %%
A = 3*C;
